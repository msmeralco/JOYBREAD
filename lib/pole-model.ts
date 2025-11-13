import * as tf from '@tensorflow/tfjs'

interface ClassInfo {
  classes: string[]
  mapping: {
    [key: string]: string[]
  }
}

let model: tf.LayersModel | null = null
let classInfo: ClassInfo | null = null

export async function loadPoleHazardModel() {
  if (model && classInfo) {
    return { model, classInfo }
  }

  try {
    // Load the graph model (not layers model)
    model = await tf.loadGraphModel('/models/model.json') as any
    
    // Load class information
    const response = await fetch('/models/classes.json')
    classInfo = await response.json()
    
    console.log('Pole hazard model loaded successfully')
    return { model, classInfo }
  } catch (error) {
    console.error('Error loading pole hazard model:', error)
    throw error
  }
}

export async function predictHazardClass(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<{
  className: string
  confidence: number
  allPredictions: { className: string; confidence: number }[]
}> {
  if (!model || !classInfo) {
    await loadPoleHazardModel()
  }

  if (!model || !classInfo) {
    throw new Error('Model not loaded')
  }

  // Preprocess the image
  const tensor = tf.tidy(() => {
    // Convert image to tensor
    let imgTensor = tf.browser.fromPixels(imageElement)
    
    // Resize to 224x224 (model input size)
    imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224])
    
    // Normalize pixel values to [0, 1] range then normalize like model expects
    imgTensor = imgTensor.toFloat().div(255.0)
    
    // Subtract 0.5 to center around 0 (as seen in model: tf.math.subtract with y=0.5)
    imgTensor = imgTensor.sub(0.5)
    
    // Add batch dimension
    return imgTensor.expandDims(0)
  })

  try {
    // Make prediction with graph model
    const predictions = model.predict(tensor) as tf.Tensor
    const probabilities = await predictions.data()
    
    // Get all predictions with confidence scores
    const allPredictions = classInfo.classes.map((className, index) => ({
      className,
      confidence: probabilities[index]
    }))
    
    // Sort by confidence
    allPredictions.sort((a, b) => b.confidence - a.confidence)
    
    // Get the top prediction
    const topPrediction = allPredictions[0]
    
    // Clean up tensors
    tensor.dispose()
    predictions.dispose()
    
    return {
      className: topPrediction.className,
      confidence: topPrediction.confidence,
      allPredictions
    }
  } catch (error) {
    tensor.dispose()
    throw error
  }
}

export function getHazardSeverity(className: string): 'urgent' | 'moderate' | 'normal' {
  if (className === 'urgent') return 'urgent'
  if (className === 'moderate') return 'moderate'
  return 'normal'
}

export function getHazardDescription(className: string): string {
  const descriptions: { [key: string]: string } = {
    urgent: 'Critical hazard detected - Requires immediate attention',
    moderate: 'Moderate hazard - Should be addressed soon',
    normal: 'Normal condition - Regular maintenance recommended'
  }
  return descriptions[className] || 'Unknown hazard type'
}

export function mapPredictionToCategory(className: string): string {
  const categoryMap: { [key: string]: string } = {
    urgent: 'leaning-pole',
    moderate: 'vegetation',
    normal: 'spaghetti-wires'
  }
  return categoryMap[className] || 'leaning-pole'
}

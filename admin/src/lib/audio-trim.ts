/**
 * Trim silence from the start and end of an audio buffer using Web Audio API.
 * Returns a WAV blob (lossless, widely supported).
 */

const SILENCE_THRESHOLD = 0.01
const WINDOW_MS = 30

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataLen = buffer.length * blockAlign
  const bufferSize = 44 + dataLen
  const arrayBuffer = new ArrayBuffer(bufferSize)
  const view = new DataView(arrayBuffer)
  let offset = 0

  const write = (str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset++, str.charCodeAt(i))
  }
  write('RIFF')
  view.setUint32(offset, bufferSize - 8, true); offset += 4
  write('WAVE')
  write('fmt ')
  view.setUint32(offset, 16, true); offset += 4
  view.setUint16(offset, format, true); offset += 2
  view.setUint16(offset, numChannels, true); offset += 2
  view.setUint32(offset, sampleRate, true); offset += 4
  view.setUint32(offset, sampleRate * blockAlign, true); offset += 4
  view.setUint16(offset, blockAlign, true); offset += 2
  view.setUint16(offset, bitDepth, true); offset += 2
  write('data')
  view.setUint32(offset, dataLen, true); offset += 4

  for (let i = 0; i < buffer.length; i++) {
    let s = 0
    for (let c = 0; c < numChannels; c++) s += buffer.getChannelData(c)[i]
    s /= numChannels
    const sample = Math.max(-1, Math.min(1, s))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

export async function trimSilence(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer()
  const audioContext = new AudioContext()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const numSamples = channelData.length
  const windowSize = Math.floor((sampleRate * WINDOW_MS) / 1000)
  let startIdx = 0
  let endIdx = numSamples - 1

  for (let i = 0; i < numSamples - windowSize; i += Math.floor(windowSize / 2)) {
    let sum = 0
    for (let j = 0; j < windowSize; j++) sum += channelData[i + j] ** 2
    if (Math.sqrt(sum / windowSize) > SILENCE_THRESHOLD) {
      startIdx = Math.max(0, i - windowSize)
      break
    }
    startIdx = i + windowSize
  }

  for (let i = numSamples - 1; i >= windowSize; i -= Math.floor(windowSize / 2)) {
    let sum = 0
    for (let j = 0; j < windowSize; j++) sum += channelData[Math.max(0, i - j)] ** 2
    if (Math.sqrt(sum / windowSize) > SILENCE_THRESHOLD) {
      endIdx = Math.min(numSamples - 1, i + windowSize)
      break
    }
    endIdx = i - windowSize
  }

  if (startIdx >= endIdx) return blob

  const duration = (endIdx - startIdx) / sampleRate
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineCtx.destination)
  source.start(0, startIdx / sampleRate, duration)

  const trimmedBuffer = await offlineCtx.startRendering()
  return audioBufferToWav(trimmedBuffer)
}

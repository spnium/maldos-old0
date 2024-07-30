import sounddevice as sd
import pyloudnorm as pyln
import numpy as np

fs = 44100
duration = 1  # seconds
data = sd.rec(duration * fs, samplerate=fs, channels=1)
sd.wait()
scaled = np.int16(data / np.max(np.abs(data)) * 32767)
rate = 44100
meter = pyln.Meter(rate) # create BS.1770 meter
loudness = meter.integrated_loudness(data) # measure loudness
print(loudness + 100)
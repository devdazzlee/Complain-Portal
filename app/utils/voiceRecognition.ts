export class VoiceRecognition {
  private recognition: any;
  private isSupported: boolean;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.isSupported = !!SpeechRecognition;
      
      if (this.isSupported) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    } else {
      this.isSupported = false;
    }
  }

  start(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (!this.isSupported) {
      onError?.('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error occurred.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'No microphone found. Please check your microphone.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone permission denied. Please allow microphone access.';
      }
      onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      // Recognition ended
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError?.('Failed to start voice recognition. Please try again.');
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  isAvailable(): boolean {
    return this.isSupported;
  }
}


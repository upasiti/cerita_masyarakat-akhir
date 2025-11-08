export default class Camera {
    constructor() {
      this.stream = null;
    }
  
    async startCamera(videoElement) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        videoElement.srcObject = this.stream;
        await videoElement.play();
      } catch (error) {
        throw new Error('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera.');
      }
    }
  
    capturePhoto(videoElement) {
      if (!this.stream) {
        throw new Error('Kamera belum diaktifkan');
      }
  
      const canvas = document.getElementById('camera-capture');
      const context = canvas.getContext('2d');
      
      // Set canvas size sama dengan video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Gambar frame video ke canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Konversi canvas ke blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const file = new File([blob], 'camera-photo.jpg', { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(file);
        }, 'image/jpeg', 0.8);
      });
    }
  
    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    }
  }
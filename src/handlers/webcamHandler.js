export default class WebcamHandler {
  constructor(
    webcamElement,
    facingMode = "user" 
  ) {
    this._webcamElement = webcamElement;
    this._addVideoConfig = {};
    this._facingMode = facingMode;
    this._webcamList = [];
    this._streamList = [];
    this._selectedDeviceId = "";
  }

  getVideoInputs(device) {
    this._webcamList = [];
    device.forEach((mediaDevice) => {
      if (mediaDevice.kind === "videoinput") {
        this._webcamList.push(mediaDevice);
      }
    });
    if (this._webcamList.length === 1) {
      this._facingMode = "user";
    }
    return this._webcamList;
  }

  selectCamera() {
    for (const webcam of this._webcamList) {
      if (
        (this._facingMode === "user" &&
          webcam.label.toLowerCase().includes("front")) ||
        (this._facingMode === "environment" &&
          webcam.label.toLowerCase().includes("back"))
      ) {
        this._selectedDeviceId = webcam.deviceId;
        break;
      }
    }
  }



  async start(startStream = true) {
    return new Promise((resolve, reject) => {
      this.stop();
      navigator.mediaDevices
        .then((stream) => {
          this._streamList.push(stream);
          this.info() 
            .then(() => {
              this.selectCamera(); 
              if (startStream) {
                this.stream()
                  .then(() => {
                    resolve(this._facingMode);
                  })
                  .catch((error) => {
                    reject(error);
                  });
              } else {
                resolve(this._selectedDeviceId);
              }
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async stream() {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices
        .getUserMedia(this.getMediaConstraints())
        .then((stream) => {
          this._streamList.push(stream);
          this._webcamElement.srcObject = stream;
          if (this._facingMode === "user") {
            this._webcamElement.style.transform = "scale(-1,1)";
          }
          this._webcamElement.play();
          resolve(this._facingMode);
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
    });
  }

}

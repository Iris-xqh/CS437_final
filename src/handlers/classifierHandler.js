import { tensor } from "@tensorflow/tfjs-core";
import { loadLayersModel } from "@tensorflow/tfjs-layers";
import "@tensorflow/tfjs-backend-webgl";

export default class ClassifierHandler {
  constructor() {
    this.model = null;
    this.label = [];
    this.config = null;
  }

  setup = async (classifierConfig, stdConfig) => {
    this.label = classifierConfig.label;
    this.config = stdConfig;
    this.model = await loadLayersModel(classifierConfig.path);
  };

  standarization = (data) =>
    data.map((data, idx) => {
      if (idx % 2 === 0) {
        return data / this.config.width;
      }
      return data / this.config.height;
    });

  predict = async (stdData) => {
    if (!this.model && !this.config) return null;
    const inputData = tensor([this.standarization(stdData)]);
    const result = await this.model.predict(inputData).data();
    return result;
  };
}

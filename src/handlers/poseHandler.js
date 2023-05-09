import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";

import DatasetHandler from "./point";
import ClassifierHandler from "./classifierHandler";
import CounterHandler from "./counterHandler";
import WebcamHandler from "./webcamHandler";

export default class PoseHandler {
  constructor(webcamElem, cnvPoseElem) {
    this.DBHandler = new DatasetHandler();

    this.camHandler = new WebcamHandler(webcamElem);
    this.mode = false;

    this.classifier = new ClassifierHandler();
    this.classify = true;
    this.theClass = "";
    this.frameClassify = 6;

    this.isLoop = false;
    this.element = {};
    this.webcamElem = webcamElem;
    this.poseE = cnvPoseElem;
    this.pose = this.poseE.getContext
      ? this.poseE.getContext("2d")
      : null;
    this.naModel = "";
    this.model = null;
    this.detector = null;
    this.detectorConfig = {};
    this.configure = {};

    this.counter = new CounterHandler(this.pose);
    this.show = false;
    this.isShowDirectionSign = true;
    this.tmpStage = "";
  }

  setup = async (modelConfig) => {
    this.configure = modelConfig.estimationConfig;
    if (
      this.naModel === modelConfig.model &&
      JSON.stringify(this.detectorConfig) ===
        JSON.stringify(modelConfig.detectorConfig)
    )
      return;
    this.naModel = modelConfig.model;
    this.model = poseDetection.SupportedModels[this.naModel];
    this.detectorConfig = modelConfig.detectorConfig;
    this.detector = await poseDetection.createDetector(
      this.model,
      this.detectorConfig
    );
  };

  getPose = async () =>
    this.detector.estimatePoses(this.webcamElem, this.configure);

  drawSkeleton = (keypoints) => {
    if (!this.pose) return null;
    this.pose.clearRect(
      0,
      0,
      this.poseE.width,
      this.poseE.height
    );

    this.pose.save();
    this.pose.beginPath();
    if (this.scaler) {
      this.pose.scale(this.scaler.w, this.scaler.h);
    }
    this.pose.fillStyle = "#eab308";
    this.counter.initStage();
    this.counter.detectAnglesAndStages(keypoints, this.theClass);
    this.pose.stroke();
    this.pose.fill();

    this.pose.beginPath();
    this.pose.fillStyle = "rgba(45,253,255,255)";
    this.pose.strokeStyle = "black";

    const xyPoints = [];
    keypoints.forEach((p, i) => {
      xyPoints.push(p.x, p.y);
      if (p.score > this.tresholdPoints) {
        this.pose.moveTo(p.x, p.y);
        this.pose.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        this.lines[i].forEach((l) => {
          if (keypoints[l[1]].score > this.tresholdPoints) {
            this.pose.moveTo(p.x, p.y);
            this.pose.lineTo(keypoints[l[1]].x, keypoints[l[1]].y);
          }
        });
      }
    });
    if (this.isExtractKeypoints) {
      this.DBHandler.addKeypoints(xyPoints);
    }
    this.pose.stroke();
    this.pose.fill();
    this.pose.strokeStyle = "white";
    this.counter.listAngles.forEach((dataAngle) => {
      this.pose.strokeText(`${dataAngle[0]}°`, dataAngle[1], dataAngle[2]);
    });
    this.counter.listAngles = [];
    this.pose.restore();
    return xyPoints;
  };


  // main loop
  drawPose = () => {
    this.getPose().then((pose) => {
      if (pose && pose.length !== 0) {
        const coordinates = this.drawSkeleton(pose[0].keypoints);
        if (
          coordinates &&
          this.classify &&
          this.element.confidenceElem &&
          this.frame % this.frameClassify === 0
        ) 
      }

      if (this.classify) {
        if (this.element.countElem) {
          this.element.countElem.innerText = this.counter.count;
        }
        if (
          this.isShowDirectionSign &&
          this.element.imgDirectionSignElem &&
          Object.keys(this.counter.nextStage).length !== 0 &&
          this.tmpStage !== this.counter.nextStage.nameStage
        ) {

          this.element.imgDirectionSignElem.children[
            this.counter.last.idStage
          ].style.display = "none";
          this.element.imgDirectionSignElem.children[
            this.counter.nextStage.idStage
          ].style.display = "block";
        }
        if (this.show && this.element.adviceWrapElem) {
          const adviceHTML = this.counter.getAdvice();
          this.element.adviceWrapElem.style.display = adviceHTML
            ? "flex"
            : "none";
          this.element.adviceWrapElem.children[0].innerText =
            "Advice each frame";
          this.element.adviceWrapElem.children[1].innerHTML = adviceHTML;
        }
      }

      if (this.isLoop) {
        window.requestAnimationFrame(this.drawPose);
      }
    });
  };
}

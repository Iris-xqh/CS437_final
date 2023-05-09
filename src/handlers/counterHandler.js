import AudioHandler from "./audioHandler";

export default class CounterHandler {
  constructor(pose) {
    this.count = 0;
    this.rules = null;
    this.pose = pose;
    this.last = {};
    this.nextStage = {};
    this.currStage = {};
    this.sumObsPoints = 0;
    this.obsStages = [];
    this.listAngles = [];
    this.isNewAssetsImgStages = false;
    this.isPlayAudStage = true;
    this.listAudStages = {};
    this.audCount = new AudioHandler({
      src: "./audio/count-from-pixabay.webm",
    });
    this.audCount.setup();
  }

  initStage = () => {
    this.currStage = {};
    this.obsStages = [];
    this.sumObsPoints = 0;
    this.rules.nameStage.forEach((stage, idx) => {
      this.obsStages.push({
        idStage: idx,
        nameStage: stage,
        sum: 0,
        detail: {},
      });
    });
    this.obsStages.push({
      idStage: -1,
      nameStage: "None",
      sum: 0,
      detail: {},
    }); 
  };

  setup = (rulesConfig) => {
    this.rules = rulesConfig;
    this.isNewAssetsImgStages = true;
    this.initStage();
    this.rules.nameStage.forEach((stage, idx) => {
      this.listAudStages[stage] = new AudioHandler({
        src: this.rules.pathAudioStage[idx],
      });
      this.listAudStages[stage].setup();
    });
  };

  resetCount = () => {
    this.count = 0;
  };

  determineCurrStage = () => {
    if (this.obsStages.length !== 0) {
      const stages = [...this.obsStages].sort((a, b) => b.sum - a.sum);
      const statusStage =
        stages[0].sum === this.sumObsPoints ? "FULL" : "PARTIAL";
      this.currStage = {
        statusStage,
        idStage: stages[0].idStage,
        nameStage: stages[0].nameStage,
      };
      
      if (
        statusStage === "FULL" &&
        this.currStage.nameStage !== this.last.nameStage &&
        this.currStage.idStage === this.rules.nameStage.length - 1
      ) {
        this.count += 1;
        if (this.isPlayAudStage && this.audCount.isLoaded) {
          this.audCount.play();
        }
      }
      if (
        statusStage === "FULL" &&
        stages[0].nameStage !== "None" &&
        (Object.keys(this.last).length === 0 ||
          this.last.nameStage !== stages[0].nameStage)
      ) {
        this.last = {
          idStage: stages[0].idStage,
          nameStage: stages[0].nameStage,
        };
        const nextIdStage =
          this.last.idStage + 1 !== this.rules.nameStage.length
            ? this.last.idStage + 1
            : 0;
        this.nextStage = {
          idStage: nextIdStage,
          nameStage: this.rules.nameStage[nextIdStage],
        };
      }
    }
  };

  getAdvice = () => {
    if (Object.keys(this.nextStage).length === 0) return "";
    let advice = "";
    let counter = 1;

    const listIdxTrueAngle = this.obsStages[this.nextStage.idStage].detail;

    this.obsStages.forEach((stage) => {
      if (stage.nameStage === this.nextStage.nameStage) return;
      Object.keys(stage.detail).forEach((idKeypoint) => {
        if (idKeypoint in listIdxTrueAngle) return;

        if (counter === 1) {
          advice += `<p>To move ${this.nextStage.nameStage} :</p>`;
        }

        const { rangeAngle } = this.rules.anglePoint[idKeypoint];

        advice += `<p>${counter}) Angle <b>${stage.detail[idKeypoint].name
          .split("_")
          .map((name) => name.charAt(0).toUpperCase() + name.substr(1))
          .join(" ")}</b> (${stage.detail[idKeypoint].angle}°) must between ${
          rangeAngle[this.nextStage.idStage].min
        }° and ${rangeAngle[this.nextStage.idStage].max}°</p>`;

        counter += 1;
      });
    });
    return advice;
  };

  detectAnglesAndStages = (keypoints, classPredict) => {
    if (this.rules && this.pose && classPredict === this.rules.nameWorkout) {
      keypoints.forEach((oriPoint, idx) => {
        if (!(idx in this.rules.anglePoint)) return;
        const { spouseIdx, rangeAngle } = this.rules.anglePoint[idx];
        const point1 = keypoints[spouseIdx[0]];
        const point2 = keypoints[spouseIdx[1]];
        let gradientLineA = Math.atan2(
          point1.y - oriPoint.y,
          point1.x - oriPoint.x
        );
        let gradientLineB = Math.atan2(
          point2.y - oriPoint.y,
          point2.x - oriPoint.x
        );
        let angle =
          parseInt(
            ((gradientLineB - gradientLineA) / Math.PI) * 180 + 360,
            10
          ) % 360;

        this.pose.moveTo(oriPoint.x, oriPoint.y);

        if (angle > 180) {
          angle = 360 - angle;
          [gradientLineA, gradientLineB] = [gradientLineB, gradientLineA];
        }

        this.pose.arc(
          oriPoint.x,
          oriPoint.y,
          20,
          gradientLineA,
          gradientLineB
        );
        this.pose.fill();

        this.listAngles.push([angle, oriPoint.x + 5, oriPoint.y]);
        this.sumObsPoints += 1;
        let isNone = true;
        rangeAngle.forEach((range, idStage) => {
          if (angle >= range.min && angle <= range.max) {
            this.obsStages[idStage].sum += 1;
            this.obsStages[idStage].detail[idx] = {
              name: keypoints[idx].name,
              angle: angle,
            };
            isNone = false;
          }
        });
        if (isNone) {
          this.obsStages[this.obsStages.length - 1].sum += 1;
          this.obsStages[this.obsStages.length - 1].detail[idx] = {
            name: keypoints[idx].name,
            angle: angle,
          };
        }
      });
      this.determineCurrStage();
    }
  };
}

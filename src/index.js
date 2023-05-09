import PoseHandler from "./handlers/poseHandler";
import TimerHandler from "./handlers/timerHandler";
import ScoreHandler from "./handlers/scoreHandler";
import SettingsHandler from "./handlers/settingsHandler";

document.addEventListener("DOMContentLoaded", async () => {
  let webcamElem = document.getElementById("webcamBox");
  const cnvPoseElem = document.getElementById("cnvPoseBox");
  const parentWebcamElem = document.getElementById("parentWebcamBox");

  const loaderElem = document.getElementById("loaderBox");
  const countElem = document.getElementById("countBox");
  const timerElem = document.getElementById("timerBox");
  const delayElem = document.getElementById("delayBox");
  const pauseBtnElem = document.getElementById("pauseBtn");
  const resumeBtnElem = document.getElementById("resumeBtn");
  const accessCamBtnElem = document.getElementById("accessCamBtn");

  const chooseWOElem = document.getElementById("chooseWOBox");
  const formChooseWOElem = document.getElementById("formChooseWOBox");
  const accessCamElem = document.getElementById("accessCamBox");
  const titleWOElem = document.getElementById("titleWOBox");
  const confidenceElem = document.getElementById("confidenceBox");
  const resultElem = document.getElementById("resultBox");
  const resultRepElem = document.getElementById("resultRepBox");
  const resultTitleElem = document.getElementById("resultTitleBox");
  const resultOKBtnElem = document.getElementById("resultOKBtn");
  const uploadVideoBtnElem = document.getElementById("uploadVideoBtn");
  const goWebcamBtnElem = document.getElementById("goWebcamBtn");

  const settingsBtnElem = document.getElementById("settingsBtn");
  const settingsElem = document.getElementById("settingsBox");
  const saveSettingsBtnElem = document.getElementById("saveSettingsBtn");
  const cancelSettingsBtnElem = document.getElementById("cancelSettingsBtn");
  const segSettingsWOBtnElem = document.getElementById("segSettingsWOBtn");
  //const segSettingsAdvBtnElem = document.getElementById("segSettingsAdvBtn");
  const bodySettingsWOElem = document.getElementById("bodySettingsWOBox");
  const bodySettingsAdvElem = document.getElementById("bodySettingsAdvBox");

  // const scoresBtnElem = document.getElementById("scoresBtn");
  const scoresElem = document.getElementById("scoresBox");
  const scoresOKBtnElem = document.getElementById("scoresOKBtn");
  const segJourneyBtnElem = document.getElementById("segJourneyBtn");
  const segBestBtnElem = document.getElementById("segBestBtn");
  const bodyJourneyElem = document.getElementById("bodyJourneyBox");
  const bodyBestScoreElem = document.getElementById("bodyBestScoreBox");

  const helpElem = document.getElementById("helpBox");
  // const helpBtnElem = document.getElementById("helpBtn");
  const segHowToUseBtnElem = document.getElementById("segHowToUseBtn");
  const segAboutBtnElem = document.getElementById("segAboutBtn");
  const bodyHowToUseElem = document.getElementById("bodyHowToUseBox");
  const bodyAboutElem = document.getElementById("bodyAboutBox");
  const helpOKBtnElem = document.getElementById("helpOKBtn");

  let isFirstPlay = true;
  let isWebcamSecPlay = false;
  let widthRealVideo = 640;
  let heightRealVideo = 360;
  let widthResult = 0;
  let heightResult = 0;
  const ratio = {
    h: 9,
    w: 16,
  };

  const pose = new PoseHandler(webcamElem, cnvPoseElem);
  const WOTimer = new TimerHandler();
  const WOScore = new ScoreHandler();
  const setting = new SettingsHandler();

  const resizeHandler = () => {
    widthResult = window.innerWidth > 1280 ? 1280 : window.innerWidth;
    heightResult = Math.floor(widthResult * (ratio.h / ratio.w));
    if (heightResult > window.innerHeight) {
      heightResult = window.innerHeight;
      widthResult = Math.floor(heightResult * (ratio.w / ratio.h));
    }

    parentWebcamElem.setAttribute(
      "style",
      `width:${widthResult}px;height:${heightResult}px`
    );

    for (let i = 0; i < parentWebcamElem.children.length; i += 1) {
      const element = parentWebcamElem.children[i];
      if (element.tagName === "CANVAS") {
        cnvPoseElem.width = widthResult;
        cnvPoseElem.height = heightResult;
      } else {
        element.style.width = `${widthResult}px`;
        element.style.height = `${heightResult}px`;
      }
    }

    pose.scaler = {
      w: widthResult / widthRealVideo,
      h: heightResult / heightRealVideo,
    };
  };
 

  
  const getAccessCam = async () => {
    if (!webcamElem.paused && pose.isLoop) return;
    loaderElem.style.display = "flex";
   
    await pose.camHandler
      .start()
      .then(() => {
        
        setting.change({
          isAccessCamera: true,
        });
        loaderElem.style.display = "none";
        accessCamElem.style.display = "none";
      })
  };

  const setupChangeWO = async (path) => {
    await fetch(path)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`HTTP error${resp.status}`);
        }
        return resp.json();
      })
     
  };

  helpOKBtnElem.addEventListener("click", () => {
    helpElem.style.display = "none";
  });

  segHowToUseBtnElem.addEventListener("click", () => {
    if (bodyHowToUseElem.style.display !== "none") return;
    bodyAboutElem.style.display = "none";
    bodyHowToUseElem.style.display = "flex";
    segAboutBtnElem.classList.remove("bg-amber-300", "text-gray-600");
    segAboutBtnElem.classList.add("bg-amber-200", "text-gray-400");
    segHowToUseBtnElem.classList.remove("bg-amber-200", "text-gray-400");
    segHowToUseBtnElem.classList.add("bg-amber-300", "text-gray-600");
  });

  segAboutBtnElem.addEventListener("click", () => {
    if (bodyAboutElem.style.display !== "none") return;
    bodyHowToUseElem.style.display = "none";
    bodyAboutElem.style.display = "flex";
    segHowToUseBtnElem.classList.remove("bg-amber-300", "text-gray-600");
    segHowToUseBtnElem.classList.add("bg-amber-200", "text-gray-400");
    segAboutBtnElem.classList.remove("bg-amber-200", "text-gray-400");
    segAboutBtnElem.classList.add("bg-amber-300", "text-gray-600");
  });

  restartBtnElem.addEventListener("click", () => {
    loaderElem.style.display = "flex";
    delayElem.innerText = "";

    WOTimer.setup({
      interval: 1000,
      duration: pose.isVideoMode
        ? Math.floor(webcamElem.duration)
        : 60 * +setting.DBWOSettings.currDuration.split(" ")[0],
      type: "DEC",
      firstDelayDuration: pose.isVideoMode ? 0 : 3,
    });

    pose.counter.resetCount();
    countElem.innerText = "0";

    WOTimer.isFirstDelay = !pose.isVideoMode;
    if (pose.isVideoMode && webcamElem.currentTime !== 0) {
      webcamElem.currentTime = 0;
      webcamElem.load();
    }

    imgDirectionSignElem.style.display = "none";
    adviceWrapElem.style.display = "none";
    resumeBtnElem.style.display = "flex";
    restartBtnElem.style.display = "none";
    pauseBtnElem.style.display = "none";
    loaderElem.style.display = "none";
  });

  recordKeypointsBtnElem.addEventListener("click", () => {
    pose.isExtractKeypoints = !pose.isExtractKeypoints;
    if (pose.isExtractKeypoints) {
      pingRecordElem.classList.remove("bg-gray-500");
      pingRecordElem.classList.add("bg-red-500");
      pingRecordElem.children[0].style.display = "block";
    } else {
      pingRecordElem.classList.remove("bg-red-500");
      pingRecordElem.classList.add("bg-gray-500");
      pingRecordElem.children[0].style.display = "none";
      pose.DBHandler.saveToCSV();
    }
  });


  scoresOKBtnElem.addEventListener("click", () => {
    scoresElem.style.display = "none";
  });


  segSettingsWOBtnElem.addEventListener("click", () => {
    if (bodySettingsWOElem.style.display !== "none") return;
    bodySettingsAdvElem.style.display = "none";
    bodySettingsWOElem.style.display = "block";
    segSettingsWOBtnElem.classList.remove("bg-amber-200", "text-gray-400");
    segSettingsWOBtnElem.classList.add("bg-amber-300", "text-gray-600");
  });

  const actionSettings = {
    currWorkoutDuration: async (data) => {
      loaderElem.style.display = "flex";
      delayElem.innerText = "";
      webcamElem.pause();
      pose.isLoop = false;
      isFirstPlay = true;
      isWebcamSecPlay = true;
      pose.counter.lastStage = {};
      pose.counter.nextStage = {};

      if (data.durationWO.isChange) {
        WOTimer.setup({
          interval: 1000,
          duration: pose.isVideoMode
            ? Math.floor(webcamElem.duration)
            : 60 * +data.durationWO.value.split(" ")[0],
          type: "DEC",
          firstDelayDuration: pose.isVideoMode ? 0 : 3,
        });

        setCurrTime();
        const title = `${pose.counter.rules.nameWorkout} - ${data.durationWO.value}`;
        titleWOElem.innerText = title;
        resultTitleElem.innerText = title;
      }
      if (data.nameWO.isChange) {
        await setupChangeWO(`./rules/${data.nameWO.value}.json`);
      }

      WOTimer.isFirstDelay = !pose.isVideoMode;
      if (pose.isVideoMode && webcamElem.currentTime !== 0) {
        webcamElem.currentTime = 0;
        webcamElem.load();
      }

      WOTimer.pause();
      // Clear screen
      imgDirectionSignElem.style.display = "none";
      adviceWrapElem.style.display = "none";
      resumeBtnElem.style.display = "flex";
      restartBtnElem.style.display = "none";
      pauseBtnElem.style.display = "none";
      loaderElem.style.display = "none";
    },
    isAudioEffect: (data) => {
      pose.counter.isPlayAudStage = data;
      WOTimer.isPlayAudTimer = data;
    },
    isFullscreen: (data) => {
      if (data && !document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else if (
        !data &&
        document.exitFullscreen &&
        document.fullscreenElement
      ) {
        document.exitFullscreen();
      }
    },
    isFlipCamera: (data) => {
      // Default (user for webcam) and auto change to "environment" if video
      const facingMode = data ? "environment" : "user";
      pose.camHandler.flip(facingMode);
    },
    isDirectionSign: (data) => {
      // Toggler to show direction sign
      pose.isShowDirectionSign = data;
      if (pose.isClassify) {
        imgDirectionSignElem.style.display = data ? "block" : "none";
      }
    },
    isDeveloperMode: (data) => {
      // Toggler to show developer mode element
      developerModeElem.style.display = data ? "flex" : "none";
    },
  };

  saveSettingsBtnElem.addEventListener("click", () => {
    // Get newest data settings
    const currWorkout = document.querySelector(
      'input[name="settingsNameWO"]:checked'
    ).value;
    const currDuration = document.querySelector(
      'input[name="settingsDurationWO"]:checked'
    ).value;
    setting.change(
      {
        currWorkout,
        currDuration,
      },
      actionSettings
    );
    settingsElem.style.display = "none";
  });

  cancelSettingsBtnElem.addEventListener("click", () => {
    settingsElem.style.display = "none";
  });

  // Get configuration of scores
  const setupWOScore = async (path) => {
    await fetch(path)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`HTTP error${resp.status}`);
        }
        return resp.json();
      })
      .then(async (data) => {
        formChooseWOElem.innerHTML = getHTMLChooseWO(data, false);
        bodySettingsWOElem.innerHTML = getHTMLChooseWO(data, true);
        document
          .getElementById("chooseHelpBtn")
          .addEventListener("click", () => {
            helpElem.style.display = "flex";
          });
        // Init and try to load localStorage data scores
        WOScore.setup(data);
        // Init and try to load localStorage data settings
        setting.setup(data.settingsConfig, {
          isFlipCamera: actionSettings.isFlipCamera,
          isDeveloperMode: actionSettings.isDeveloperMode,
        });
        if (
          setting.isGetPrevSettings &&
          setting.DBWOSettings.currWorkout &&
          setting.DBWOSettings.currWorkout !== "None"
        ) {
          loaderElem.style.display = "flex";
          await setupChangeWO(
            `./rules/${setting.DBWOSettings.currWorkout}.json`
          );
        } else {
          chooseWOElem.style.display = "flex";
          loaderElem.style.display = "none";
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  await setupWOScore("./mock-data/workout.json");
  webcamElem.addEventListener("loadeddata", () => {
    if (!pose.isVideoMode) {
      if (pose.isClassify) {
        pose.isClassify = false;
      }
      pose.isLoop = true;
      sliderCameraElem.checked = true;
      if (isWebcamSecPlay) {
        isWebcamSecPlay = false;
      }
      delayElem.innerText = "";
      WOTimer.pause();
      pose.counter.resetCount();
      pose.drawPose();
    }
  });

  accessCamBtnElem.addEventListener("click", async () => {
    await getAccessCam();
  });

  formChooseWOElem.addEventListener("submit", async (event) => {
    event.preventDefault();
    // Get user choice
    const workout = document.querySelector(
      'input[name="chooseNameWO"]:checked'
    ).value;
    const duration = document.querySelector(
      'input[name="chooseDurationWO"]:checked'
    ).value;
    if (event.submitter.id === "submitWOBtn") {
      // Change without action as initial run (first play)
      setting.change({
        currWorkout: workout,
        currDuration: duration,
      });
      chooseWOElem.style.display = "flex";
      loaderElem.style.display = "flex";
      await setupChangeWO(`./rules/${workout}.json`);
    }
  });
  
  const finishTimerCB = () => {
    if (!pose.isVideoMode) {
      WOScore.addNewData({
        id: +new Date(),
        nameWorkout: pose.counter.rules.nameWorkout,
        duration: setting.DBWOSettings.currDuration,
        repetition: pose.counter.count,
        date: new Date().toLocaleString(),
      });
    }
    setCurrTime();
    WOTimer.isFirstDelay = !pose.isVideoMode;
    resultRepElem.innerText = pose.counter.count;
    WOTimer.start(delayCB, finishDelayCB, timerCB, finishTimerCB);
    WOTimer.pause();
    webcamElem.pause();
    isFirstPlay = true;
    pose.isLoop = false;
    pose.counter.resetCount();
    pose.counter.lastStage = {};
    pose.counter.nextStage = {};
    resultElem.style.display = "flex";
    resumeBtnElem.style.display = "flex";
    restartBtnElem.style.display = "none";
    pauseBtnElem.style.display = "none";
    imgDirectionSignElem.style.display = "none";
    adviceWrapElem.style.display = "none";
  };

  resultOKBtnElem.addEventListener("click", () => {
    resultElem.style.display = "none";
    if (isFirstPlay && pose.isVideoMode) {
      webcamElem.pause();
      webcamElem.currentTime = 0;
      webcamElem.load();
    } else {
      WOTimer.reset();
      setCurrTime();
    }
  });

  pauseBtnElem.addEventListener("click", () => {
    WOTimer.pause();
    webcamElem.pause();
    pose.isLoop = false;
    resumeBtnElem.style.display = "flex";
    restartBtnElem.style.display = "flex";
    pauseBtnElem.style.display = "none";
  });

  resumeBtnElem.addEventListener("click", () => {
    if (!isFirstPlay && !webcamElem.paused && pose.isLoop) return;
    pauseBtnElem.style.display = "flex";
    restartBtnElem.style.display = "none";
    resumeBtnElem.style.display = "none";
    const firstPlay = isFirstPlay;

    if (isFirstPlay) {
      isFirstPlay = false;
      pose.isClassify = true;
      WOTimer.start(delayCB, finishDelayCB, timerCB, finishTimerCB);
    }

    WOTimer.resume();
    pose.isLoop = true;
    webcamElem.play().then(() => {
      if (!isWebcamSecPlay && firstPlay && !pose.isVideoMode) {
        console.log("It run?");
        isWebcamSecPlay = true;
        // Return to stop redraw again (first play)
        return;
      }
      pose.drawPose();
    });
  });

  uploadVideoBtnElem.addEventListener("change", (event) => {
    if (event.target.files && event.target.files[0]) {
      pose.camHandler.stop();
      pose.isClassify = true;
      pose.isLoop = false;
      pose.isVideoMode = true;
      webcamElem.pause();
      webcamElem.remove();

      const newWebcamElem = document.createElement("video");
      newWebcamElem.setAttribute("id", "webcamBox");
      newWebcamElem.setAttribute("class", "bg-gray-200 z-10");
      newWebcamElem.setAttribute(
        "style",
        `width: ${widthResult}px; height: ${heightResult}px`
      );
      newWebcamElem.muted = true;

      parentWebcamElem.insertBefore(newWebcamElem, parentWebcamElem.firstChild);

      newWebcamElem.setAttribute(
        "src",
        URL.createObjectURL(event.target.files[0])
      );
      newWebcamElem.load();
      newWebcamElem.play();
      setting.change(
        { isFlipCamera: true },
        { isFlipCamera: actionSettings.isFlipCamera }
      );

      newWebcamElem.addEventListener("loadeddata", () => {
        if (pose.isVideoMode) {
          webcamElem = newWebcamElem;
          pose.webcamElem = newWebcamElem;
          pose.camHandler._webcamElement = newWebcamElem;
        }
        pose.counter.resetCount();
        countElem.innerText = "0";
        delayElem.innerText = "";
        WOTimer.setup({
          interval: 1000,
          duration: pose.isVideoMode
            ? Math.floor(webcamElem.duration)
            : 60 * +setting.DBWOSettings.currDuration.split(" ")[0],
          type: "DEC",
          firstDelayDuration: pose.isVideoMode ? 0 : 3,
        });
        WOTimer.isFirstDelay = !pose.isVideoMode;
        WOTimer.pause();
        setCurrTime();
        webcamElem.pause();
        pose.counter.lastStage = {};
        pose.counter.nextStage = {};
        if (widthRealVideo !== 0 && pose.isVideoMode) {
          heightRealVideo = newWebcamElem.videoHeight;
          widthRealVideo = newWebcamElem.videoWidth;
        }
        pose.scaler = {
          w: widthResult / widthRealVideo,
          h: heightResult / heightRealVideo,
        };
        pose.classifier.stdConfig = {
          width: widthRealVideo,
          height: heightRealVideo,
        };
        resumeBtnElem.style.display = "flex";
        restartBtnElem.style.display = "none";
        pauseBtnElem.style.display = "none";
        imgDirectionSignElem.style.display = "none";
        adviceWrapElem.style.display = "none";
        sliderCameraElem.checked = !pose.isVideoMode;
      });
    }
  });

  goWebcamBtnElem.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!pose.isVideoMode) return;
    widthRealVideo = 640;
    heightRealVideo = 360;
    pose.camHandler._addVideoConfig = {
      width: widthRealVideo,
      height: heightRealVideo,
    };
    pose.classifier.stdConfig = {
      width: widthRealVideo,
      height: heightRealVideo,
    };
    pose.isLoop = false;
    isWebcamSecPlay = true;
    sliderCameraElem.checked = true;
    pose.isVideoMode = false;
    await pose.camHandler.start();
  });
});

Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MzUzNTUxZS1hNGEyLTRhNjItYjUwMy04ZmQ0NmZkYmNhZDciLCJpZCI6OTI0MTIsImlhdCI6MTY1MTkyMDAyNH0.U9AZ-zuGFPT8Mn582aPzzUAN-rtAv7SOtMtQnkeEmdE";

const esri = new Cesium.ArcGisMapServerImageryProvider({
  url:
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/",
});

const viewer = new Cesium.Viewer("cesiumContainer", {
  timeline: false,
  animation: false,
  terrainProvider: new Cesium.CesiumTerrainProvider({
    url: Cesium.IonResource.fromAssetId(1),
  }),
  geocoder: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  baseLayerPicker: false,
  imageryProvider: esri,
});

// 显示帧率
viewer.scene.debugShowFramesPerSecond = false;
viewer.scene.globe.depthTestAgainstTerrain = false;
// 隐藏 Cesium Logo
viewer.cesiumWidget.creditContainer.style.display = "none";

const tileset = viewer.scene.primitives.add(
  new Cesium.Cesium3DTileset({
    // url: Cesium.IonResource.fromAssetId(75343)
    url: "nanchong1_tiles/tileset.json",
  })
);

// 操作行为
viewer.scene.screenSpaceCameraController.enableTilt = false;
viewer.scene.screenSpaceCameraController.enableRotate = false;

viewer.scene.screenSpaceCameraController.lookEventTypes = [
  Cesium.CameraEventType.LEFT_DRAG,
];

let params = {
  tx: 106.132027, // 模型中心x轴坐标
  ty: 30.825008, // 模型中心y轴坐标
  tz: 75, // 模型中心z轴坐标（高程）
  rx: 0, // x轴方向旋转角度
  ry: 0, // y轴方向旋转角度
  rz: -129, // z轴方向旋转角度
  scale: 0.4,
};

function update3DTilesMatrix() {
  // 经纬度、高程转笛卡尔坐标
  let position = Cesium.Cartesian3.fromDegrees(params.tx, params.ty, params.tz);
  let mat = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  // 缩放
  let scale = Cesium.Matrix4.fromUniformScale(params.scale);
  Cesium.Matrix4.multiply(mat, scale, mat);
  // 旋转
  let mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
  let my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
  let mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
  let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
  let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
  let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
  Cesium.Matrix4.multiply(mat, rotationX, mat);
  Cesium.Matrix4.multiply(mat, rotationY, mat);
  Cesium.Matrix4.multiply(mat, rotationZ, mat);

  tileset._root.transform = mat;
}

tileset.readyPromise.then(function (argument) {
  update3DTilesMatrix();
});

let step = 1;

function changeStep(stepIn) {
  step = stepIn;
}

function change(type) {
  switch (type) {
    case 0:
      params.tx += step / 10000;
      break;
    case 1:
      params.tx -= step / 10000;
      break;
    case 2:
      params.ty += step / 10000;
      break;
    case 3:
      params.ty -= step / 10000;
      break;
    case 4:
      params.tz += step;
      break;
    case 5:
      params.tz -= step;
      break;
  }

  update3DTilesMatrix();
}

function changeVisible() {
  tileset.show = !tileset.show;
}

function backToDashBoard() {
  setTimeout(() => {
    window.location.href = "http://8.142.104.243:8080/";
  }, 800);
}

let setPosition = document.getElementById("setPosition");
let showButton = document.getElementById("showButton");

function changeToolbar() {
  setPosition.style.display = "none";
  showButton.style.display = "block";
}

function showToolbar() {
  showButton.style.display = "none";
  setPosition.style.display = "block";
}

// Override behavior of home button
viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (
  commandInfo
) {
  // Fly to custom position
  viewer.zoomTo(
    tileset,
    new Cesium.HeadingPitchRange(
      -0.5,
      -0.4,
      tileset.boundingSphere.radius * 1.6
    )
  );
  // Tell the home button not to do anything
  commandInfo.cancel = true;
});

const viewModel = {
  scale: 0.4,
  height: 0,
  RotateX: 0,
  RotateY: 0,
  RotateZ: -129,
};

Cesium.knockout.track(viewModel);

const toolbar = document.getElementById("toolbar");
Cesium.knockout.applyBindings(viewModel, toolbar);

Cesium.knockout.getObservable(viewModel, "scale").subscribe(function (scale) {
  scale = Number(scale);
  if (isNaN(scale)) {
    return;
  }
  params.scale = scale;

  update3DTilesMatrix();
});

Cesium.knockout.getObservable(viewModel, "height").subscribe(function (height) {
  height = Number(height);
  if (isNaN(height)) {
    return;
  }

  const cartographic = Cesium.Cartographic.fromCartesian(
    tileset.boundingSphere.center
  );
  const surface = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    0.0
  );
  const offset = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    height
  );
  const translation = Cesium.Cartesian3.subtract(
    offset,
    surface,
    new Cesium.Cartesian3()
  );
  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
});

Cesium.knockout
  .getObservable(viewModel, "RotateX")
  .subscribe(function (RotateX) {
    RotateX = Number(RotateX);
    if (isNaN(RotateX)) {
      return;
    }
    params.rx = RotateX;

    update3DTilesMatrix();
  });

Cesium.knockout
  .getObservable(viewModel, "RotateY")
  .subscribe(function (RotateY) {
    RotateY = Number(RotateY);
    if (isNaN(RotateY)) {
      return;
    }
    params.ry = RotateY;

    update3DTilesMatrix();
  });

Cesium.knockout
  .getObservable(viewModel, "RotateZ")
  .subscribe(function (RotateZ) {
    RotateZ = Number(RotateZ);
    if (isNaN(RotateZ)) {
      return;
    }
    params.rz = RotateZ;

    update3DTilesMatrix();
  });

let lastWhellCameraPosition = undefined;
let lastWhellCameraPositionTimes = 0;
let currentCameraPosition = viewer.camera.position;
let ellipsoid = viewer.scene.globe.ellipsoid;
viewer.screenSpaceEventHandler.setInputAction(function onMouseWheel(e) {
  if (
    e > 0 &&
    lastWhellCameraPosition &&
    Math.abs(currentCameraPosition.x - lastWhellCameraPosition.x) < 0.001 &&
    Math.abs(currentCameraPosition.y - lastWhellCameraPosition.y) < 0.001 &&
    Math.abs(currentCameraPosition.z - lastWhellCameraPosition.z) < 0.001
  ) {
    if (lastWhellCameraPositionTimes > 1) {
      console.log(e);
      let cameraHeight = ellipsoid.cartesianToCartographic(
        currentCameraPosition
      ).height;
      viewer.camera.moveForward(cameraHeight / 50.0);
    } else {
      lastWhellCameraPositionTimes++;
    }
  } else {
    lastWhellCameraPositionTimes = 0;
  }
  lastWhellCameraPosition = currentCameraPosition.clone();
}, Cesium.ScreenSpaceEventType.WHEEL);

(async () => {
  try {
    await tileset.readyPromise;
    await viewer.zoomTo(
      tileset,
      new Cesium.HeadingPitchRange(
        -0.5,
        -0.4,
        tileset.boundingSphere.radius * 1.6
      )
    );

    // Apply the default style if it exists
    let extras = tileset.asset.extras;
    if (
      Cesium.defined(extras) &&
      Cesium.defined(extras.ion) &&
      Cesium.defined(extras.ion.defaultStyle)
    ) {
      tileset.style = new Cesium.Cesium3DTileStyle(extras.ion.defaultStyle);
    }
  } catch (error) {
    console.log(error);
  }
})();

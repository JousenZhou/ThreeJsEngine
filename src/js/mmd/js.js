//加载进度
let onProgress = function (xhr) {
    console.log(this);
    if (xhr.lengthComputable) {
        let percentComplete = Number(xhr.loaded / xhr.total * 100);
        console.log(Math.round(percentComplete, 2) + "% downloaded");
    }
};
//加载失败
let onError = function (xhr) {
    console.log("error", xhr);
};

export default class {
    //构造函数
    constructor(config) {
        let {scene, camera, renderer, gui} = config || {};
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        //初始化MMD模型加载器
        this.loader = new THREE.MMDLoader();
        //初始化音频加载器
        this.AudioLoader = new THREE.AudioLoader();
        //初始化时间
        this.clock = new THREE.Clock();
    }

    //加载模型与动画
    loadWithAnimation(pmx, behavior) {
        return new Promise(resolve => {
            this.loader.loadWithAnimation(pmx, behavior, (mmd) => {
                mmd.mesh.castShadow = true;
                mmd.mesh.receiveShadow = true;
                resolve({
                    mesh: mmd.mesh,
                    animation: mmd.animation,
                });
            });
        });

    }

    //加载音频
    loadAudio(src) {
        return new Promise(resolve => {
            this.AudioLoader.load(src, function (Audio) {
                resolve(Audio);
            });
        });

    }

    //加载镜头
    loadCamera(cameraFiles) {
        return new Promise(resolve => {
            this.loader.loadAnimation(cameraFiles, this.camera, function (CameraData) {
                resolve(CameraData);
            }, this.onProgress, this.onError);
        });

    }

    //动画辅助驱动属性初始化
    loadHelper(config) {
        let {gui, physics, ik, physicsHelper} = config || {};
        //初始化MMD动画驱动辅助
        this.helper = new THREE.MMDAnimationHelper({afterglow: 2.0});
        this.helper.enabled["cameraAnimation"] = false;
        this.helper.enabled["animation"] = false;
        this.helper.enabled["physics"] = true;
        this.helper.enabled["grant"] = true;
        this.helper.enabled["ik"] = true;
        if (gui) {
            let renderGui = this.gui.addFolder("MMD");
            let renderControl = new function () {
                this["物理效果"] = physics || false;
                this["骨骼"] = ik || false;
                this["物理刚体"] = physicsHelper || false;
            };
            renderGui.add(renderControl, "物理效果").onChange((e) => {
                this.helper.enabled["physics"] = e;
            });
            renderGui.add(renderControl, "骨骼").onChange((e) => {
                this.ikHelper.visible = e;
            });
            renderGui.add(renderControl, "物理刚体").onChange((e) => {
                this.physicsHelper.visible = e;
            });
        }
    }

    //将MMD添加至动画驱动
    addToHelperOfMMD(mmd) {
        this.helper.add(mmd.mesh, {
                animation: mmd.animation,
                physics: true,
            },
        );
        //骨骼辅助
        let ikHelper = this.helper.objects.get(mmd.mesh).ikSolver.createHelper();
        ikHelper.visible = false;
        this.scene.add(ikHelper);
        this.ikHelper = ikHelper;
        //物理刚体辅助
        let physicsHelper = this.helper.objects.get(mmd.mesh).physics.createHelper();
        physicsHelper.visible = false;
        this.scene.add(physicsHelper);
        this.physicsHelper = physicsHelper;
    }

    //将相机[镜头数据]添加至动画驱动
    addToHelperOfCamera(cameraAnimation) {
        this.helper.add(this.camera, {
            animation: cameraAnimation,
        });
    }

    //音频渲染
    musicRender(music, mesh, options) {
        let {positionSource, distance, rolloffFactor} = options;
        //定点
        let listener = new THREE.AudioListener();
        this.camera.add(listener);

        let api = positionSource ? THREE.PositionalAudio : THREE.Audio;

        let sound = new api(listener);
        sound.setBuffer(music);
        sound.setLoop(true);
        this.sound = sound;
        positionSource && (() => {
            sound.setRefDistance(distance);    //距离物体多远时声音开始减弱
            sound.setRolloffFactor(rolloffFactor);  //声音下降的速度
            mesh.add(sound);
        })();
    }

    //相机设置默认位置
    setDefaultCamera() {
        this.camera.position.set(0, 50, 20);
    }

    //镜面地板
    setDefaultFlood() {
        let palaneSize = 20;
        let mirrorPixelRatio = 2;


        let planeGeometry2 = new THREE.PlaneBufferGeometry(100, 100);


        let options = {

            clipBias: 0.03,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0x666666,
            recursion: 1,

        };


        let mirror = new THREE.Reflector(planeGeometry2, options);
        mirror.rotateX(-Math.PI / 2);
        // this.scene.add(mirror);
        let planeGeo = new THREE.PlaneGeometry(100, 100);

        //MIRORR planes
        // let groundMirror = new THREE.Mirror(this.renderer, this.camera, {
        //         clipBias: 0.0,
        //         textureWidth: window.innerWidth * mirrorPixelRatio * window.devicePixelRatio,
        //         textureHeight: window.innerHeight * mirrorPixelRatio * window.devicePixelRatio,
        //         color: 0x777777,
        //         debugMode: true
        //     }
        // );
        //
        // let mirrorMesh = new THREE.Mesh(planeGeo, groundMirror.material);
        // mirrorMesh.add(groundMirror);
        // mirrorMesh.rotateX(-Math.PI / 2);
        // this.scene.add(mirrorMesh);


        // let groundMirror = new THREE.Mirror( palaneSize * 10,palaneSize * 10, {
        //     clipBias: 0.003,
        //     //镜面分辨率
        //     textureWidth: window.innerWidth*mirrorPixelRatio * window.devicePixelRatio,
        //     textureHeight: window.innerHeight*mirrorPixelRatio * window.devicePixelRatio,
        //     color: 0x777777
        // } );
        // groundMirror.rotateX( - Math.PI / 2 );
        // this.scene.add( groundMirror );

        let planeGeometry = new THREE.PlaneGeometry(palaneSize * 10, palaneSize * 10);
        let planeMaterial = new THREE.MeshLambertMaterial({
            color: 0xcccccc,
        });

        let plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;

        plane.rotation.x = -0.5 * Math.PI;
        plane.position.y = 0;
        plane.position.z = 0;
        plane.name = "plane";

        this.scene.add(plane);
    }

    //循环渲染
    render() {
        let delta = this.clock.getDelta();
        this.helper.update(delta);
    }

    //控制器
    mmdControl() {
        let play = () => {
            this.helper.enabled["animation"] = true;
            this.helper.enabled["cameraAnimation"] = true;
            this.sound.play();
        };
        let stop = () => {
            this.helper.enabled["animation"] = false;
            this.helper.enabled["cameraAnimation"] = false;
            this.sound.stop();
        };
        return {
            play, stop
        };
    }

    //加载场mmd景
    loadScene(scene){
        return new Promise(resolve => {
            this.loader.load(scene,(mmdScene)=>{
                resolve(mmdScene)
            })
        })

    }
}

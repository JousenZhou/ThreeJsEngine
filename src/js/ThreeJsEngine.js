import Stats from "@/lib/stats";
import dat from "@/lib/dat.gui";
import Detector from "@/lib/Detector";

class ThreeJs {
    /*构造函数*/
    constructor({el, options, data, methods, mounted}) {
        Object.keys(methods).forEach((key) => {
            this[key] = methods[key];
        });
        Object.keys(data()).forEach((key) => {
            this[key] = data()[key];
        });
        this.root = el;
        this.script = mounted;
        this.renderParams = {};
        this.sceneManage = {};
        options.browserCheck ? this.browserSupport(options) : this.createScene(options);
        this.options = options;
        console.log(this.options);
    }

    browserSupport(options) {
        !Detector.webgl ? (() => {
            let warnings = document.createElement("div");
            warnings.style.cssText =
                "line-height: 24px;" +
                "font-size: 16px ;" +
                "text-height:100px;" +
                "width:500px;position:" +
                "relative;left:calc(50% - 250px);" +
                "text-align:center;" +
                "background:F9F9F9;" +
                "margin-top: 200px;";

            warnings.innerHTML = "你的浏览器内核版本过低或者不支持WebGL,请更换Chrome（谷歌）、IE9（或以上）、Edge。若你是双核浏览器（如Uc、360等）,请切换核心进行刷新!";
            this.root.appendChild(warnings);
        })() : (() => {
            this.createScene(options);
        })();
    }

    createScene(options) {
        // 物理引擎
        let physics = options.physics;
        if (physics) {
            // 启动物理场景
            if (Physijs) {
                Physijs.scripts.worker = "/lib/physijs_worker.js";
                Physijs.scripts.ammo = "/lib/ammo.js";
                this.scene = new Physijs.Scene();
                // 重力加速度
                this.scene.setGravity(new THREE.Vector3(0, -9.8, 0));
            } else {
                //  未引入插件
                console.log("请确保引入physi.js/physijs_worker.js/ammo.js");
            }
        } else {
            this.scene = new THREE.Scene();
        }
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        if(options.cameraPosition){this.camera.position.set(options.cameraPosition.x, options.cameraPosition.y, options.cameraPosition.z);}
        else{this.camera.position.set(30,30,30)}
        if(options.cameraLookAt){this.camera.lookAt(options.cameraLookAt.x, options.cameraLookAt.y, options.cameraLookAt.z);}
        this.renderer = new THREE.WebGLRenderer({
            alpha: options.alpha || false,
            antialias: options.antialias || false
        });
        this.renderer["alpha"] = options.alpha || false;
        this.renderer["antialias"] = options.antialias || false;
        this.renderer.shadowMap.enabled = options.shadowMapEnabled || false;
        this.renderer.setClearColor(new THREE.Color(options.backgroundColor || "#ffffff"));
        this.renderer.setSize(options.width || window.innerWidth, options.height || window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        (!options.height && !options.width) && this.onResize();
        this.root.appendChild(this.renderer.domElement);
        this.render();
    }

    render() {
        Object.keys(this.renderParams).forEach((key) => {
            this.renderParams[key]();
        });
        // 物理系统渲染
        this.options && this.options.physics && this.scene.simulate();
        window.requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        window.onresize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
    }

    initStats(el) {
        let stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = "absolute";
        stats.domElement.style.left = "0px";
        stats.domElement.style.top = "0px";
        el.appendChild(stats.domElement);
        this.renderParams["stats"] = (() => {
            stats.update();
        });
        return this;
    }

    setRenderFun(key, fun) {
        this.renderParams[key] = fun;
    }

    setOrbitControlsCamera() {
        let orbit = new THREE.OrbitControls(this.camera);
        this.setRenderFun("OrbitControls", () => {
            orbit.update();
        });
        return this;
    }

    setAxes(length) {
        let axesHelper = new THREE.AxesHelper(length || 1000);
        this.scene.add(axesHelper);
        return this;
    }

    GuiControl() {
        document.getElementsByClassName('dg main').length>0&&document.getElementsByClassName('dg main')[0].remove()
        this.gui = new dat.GUI();
        let renderGui = this.gui.addFolder("渲染器");
        let {renderer} = this;
        let renderControl = new function () {
            this["全局阴影"] = renderer.shadowMapEnabled;
            this["抗锯齿"] = renderer.antialias ? "已开启" : "未启动";
            this["透明度"] = renderer.alpha ? "已开启" : "未启动";
        };
        renderGui.add(renderControl, "全局阴影").onChange((e) => {
            this.renderer.shadowMap.enabled = e;
        });
        renderGui.add(renderControl, "抗锯齿");
        renderGui.add(renderControl, "透明度");
        return this;
    }

    ambient({gui, color, name}) {
        //环境光
        let reg = /#([\da-f]{3}){1,2}/gi;
        let right = color.match(reg);
        !right && console.log("很抱歉，环境光目前限制颜色为十六进制,现在设置为默认颜色#666666");

        let defaultColor = "#666666";
        let ambientLight = new THREE.AmbientLight(right ? color : defaultColor);
        this.scene.add(ambientLight);
        this.sceneManage[name || "ambient"] = ambientLight;
        if (gui) {
            this.gui && (() => {
                let renderGui = this.gui.addFolder("环境光");
                let renderControl = new function () {
                    let colors = new THREE.Color(right ? color : defaultColor);
                    this["颜色"] = colors.getStyle();
                };
                renderGui.addColor(renderControl, "颜色").onChange((e) => {
                    // let color = `rgb(${parseInt(e.r)},${parseInt(e.g)},${parseInt(e.b)})`;
                    ambientLight.color = new THREE.Color(e);
                });
            })();
        }
        return this;
    }

    directional({gui, color, name, Shadow, position, helper, intensity}) {
        let reg = /#([\da-f]{3}){1,2}/gi;
        let right = color.match(reg);
        !right && console.log("很抱歉，平行光目前限制颜色为十六进制,现在设置为默认颜色#ffffff");

        let defaultColor = new THREE.Color(0x333333).getStyle();
        //平行光[太阳光]
        let DirectionalLight = new THREE.DirectionalLight(right ? color : defaultColor);
        DirectionalLight.position.set(position.x, position.y, position.z);

        DirectionalLight.castShadow = Shadow || false;
        DirectionalLight.intensity = intensity || 0.5;
        DirectionalLight.shadow.mapSize.x = 2048;
        DirectionalLight.shadow.mapSize.y = 2048;
        DirectionalLight.shadow.camera.near = 2;
        DirectionalLight.shadow.camera.far = 200;
        DirectionalLight.shadow.camera.right = 50;
        DirectionalLight.shadow.camera.top = 50;
        DirectionalLight.shadow.camera.left = -50;
        DirectionalLight.shadow.camera.bottom = -50;
        DirectionalLight.distance = 0;
        DirectionalLight.shadow.bias = -0.001;
        this.scene.add(DirectionalLight);

        this.sceneManage[name || "directional"] = DirectionalLight;


        let cameraHelper = new THREE.CameraHelper(DirectionalLight.shadow.camera);
        helper && this.scene.add(cameraHelper);

        let sphereLight = new THREE.SphereGeometry(1);
        let sphereLightMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color("red")});
        let sphereLightMesh = new THREE.Mesh(sphereLight, sphereLightMaterial);
        sphereLightMesh.castShadow = Shadow || false;
        sphereLightMesh.position.copy(DirectionalLight.position);
        helper && this.scene.add(sphereLightMesh);

        if (gui) {
            this.gui && (() => {
                let renderGui = this.gui.addFolder("平行光");
                let renderControl = new function () {
                    // let color = new THREE.Color(color || 0x333333);
                    this["颜色"] = right ? color : defaultColor;
                    this["辅助"] = helper;
                    this["阴影"] = Shadow || false;
                    this["光强"] = DirectionalLight.intensity;
                    this["x"] = position.x;
                    this["y"] = position.y;
                    this["z"] = position.z;
                };
                renderGui.addColor(renderControl, "颜色").onChange((e) => {
                    // console.log(e)
                    // let color  = new THREE.Color(`rgb(${parseInt(e.r)},${parseInt(e.g)},${parseInt(e.b)})`);
                    DirectionalLight.color = new THREE.Color(e);
                });
                renderGui.add(renderControl, "辅助").onChange((e) => {
                    e ? this.scene.add(cameraHelper) : this.scene.remove(cameraHelper);
                    e ? this.scene.add(sphereLightMesh) : this.scene.remove(sphereLightMesh);
                });
                renderGui.add(renderControl, "阴影").onChange((e) => {
                    DirectionalLight.castShadow = e;
                    sphereLightMesh.castShadow = e;
                });
                renderGui.add(renderControl, "光强", 0, 5).onChange((e) => {
                    DirectionalLight.intensity = e;
                });
                renderGui.add(renderControl, "x", -999, 999).onChange((e) => {
                    DirectionalLight.position.x = e;
                    sphereLightMesh.position.copy(DirectionalLight.position);
                });
                renderGui.add(renderControl, "y", -999, 999).onChange((e) => {
                    DirectionalLight.position.y = e;
                    sphereLightMesh.position.copy(DirectionalLight.position);
                });
                renderGui.add(renderControl, "z", -999, 999).onChange((e) => {
                    DirectionalLight.position.z = e;
                    sphereLightMesh.position.copy(DirectionalLight.position);
                });
            })();
        }
        // Model specific Shadow parameters
        // this.renderer.shadowMap.renderSingleSided = false;
        // this.renderer.shadowMap.renderReverseSided = false;
        return this;
    }

    expandPlugin(config) {
        let this_ = this;
        Object.keys(config).forEach((key) => {
            class faker extends config[key] {
                constructor(config) {
                    super(config);
                    this.scene = this_.scene;
                    this.camera = this_.camera;
                    this.renderer = this_.renderer;
                    this.gui = this_.gui;
                }
            }

            this[key] ? console.log(`name:${key},已被使用`) : this[key] = faker;
        });
        return this;
    }
}

export default ThreeJs;
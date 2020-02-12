<template>
    <div>
        <div ref="Stats"></div>
        <div ref="ThreeJs"></div>
    </div>
</template>

<script>
    import ThreeJs from "@/js/ThreeJsEngine";
    import MMD from "../js/mmd/js";
    export default {
        name: "index",
        mounted() {
            new ThreeJs({
                el: this.$refs["ThreeJs"],
                options: {
                    // width:500,
                    // height:300,
                    cameraLookAt:{x:0, y:0, z:0},
                    cameraPosition:{x:-25,y:30,z:25},
                    browserCheck: true,
                    backgroundColor: "#EEEEEE",
                    alpha: true,
                    antialias: true,
                    shadowMapEnabled: false,
                    physics: true
                },
                data() {
                    return {};
                },
                methods: {
                    // 物理场景测试
                    physicsTest:function () {
                        // 物理场景
                        let ground = new Physijs.BoxMesh(
                            new THREE.CubeGeometry(100, 2, 100),
                            new THREE.MeshPhongMaterial({
                                restitution: 0.5,
                                friction: 0.5
                            }),
                            0 // 固定不动
                        );
                        this.scene.add(ground);

                        let ground2 = new Physijs.BoxMesh(
                            new THREE.CubeGeometry(10, 10, 10),
                            new THREE.MeshPhongMaterial({
                                restitution: 0.5,
                                friction: 0.5
                            }),
                            1 // 重力控制
                        );
                        ground2.position.set(0, 100, 0);
                        this.scene.add(ground2);
                    },
                    // 正常场景测试
                    normalTest:function () {
                        let planeGeometry = new THREE.PlaneGeometry(60, 20, 1, 1);
                        let planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
                        let plane = new THREE.Mesh(planeGeometry, planeMaterial);
                        plane.receiveShadow = true;
                        plane.rotation.x = -0.5 * Math.PI;
                        plane.position.x = 15;
                        plane.position.y = 0;
                        plane.position.z = 0;
                        this.scene.add(plane);

                        let cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
                        let cubeMaterial = new THREE.MeshLambertMaterial({color: 0xff0000});
                        let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
                        cube.castShadow = true;
                        cube.position.x = -4;
                        cube.position.y = 3;
                        cube.position.z = 0;
                        this.scene.add(cube);

                        let sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
                        let sphereMaterial = new THREE.MeshLambertMaterial({color: 0x7777ff});
                        let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                        sphere.position.x = 20;
                        sphere.position.y = 0;
                        sphere.position.z = 2;
                        sphere.castShadow = true;
                        this.scene.add(sphere);
                        let step = 0;
                        this.setRenderFun('transform',()=>{
                            cube.rotation.x += 0.02;
                            cube.rotation.y += 0.02;
                            cube.rotation.z += 0.02;
                            step += 0.03;
                            sphere.position.x = 20 + ( 10 * (Math.cos(step)));
                            sphere.position.y = 2 + ( 10 * Math.abs(Math.sin(step)));
                        })
                    },
                    // MMd测试
                    MMdTest:async function () {
                        let i = new this.mmd();
                        let data = {
                            mmdModel: "/static/mmdModel/Reinhardt.pmx",
                            mmdAnimation: ["/static/mmdAnimation/action.vmd"],  //👈这是数组
                            mmdMusic: "/static/mmdMusic/病名为爱.mp3",
                            mmdCamera: ["/static/mmdCamera/camera.vmd"],
                            mmdScene: "/static/mmdScene/下影灯/下影灯ver1.0.pmx"
                        };
                        let mmdMsg = await i.loadWithAnimation(data.mmdModel, data.mmdAnimation);
                        let mmdCamera = await i.loadCamera(data.mmdCamera);//自动镜头
                        let mmdMusic = await i.loadAudio(data.mmdMusic);// 定点声源/全局声源
                        // let scene = await i.loadScene(data.mmdScene);
                        // scene.scale.set(10, 10, 10);
                        mmdMsg.mesh.scale.set(0.9,0.9,0.9);
                        // this.scene.add(scene);

                        this.scene.add(mmdMsg.mesh);
                        //控制台【Gui】 骨骼，物理，刚体，动画
                        i.loadHelper({gui: true});
                        i.addToHelperOfMMD(mmdMsg);
                        i.addToHelperOfCamera(mmdCamera);
                        i.musicRender(mmdMusic, mmdMsg.mesh, {
                            positionSource: false,
                            distance: 40,
                            rolloffFactor: .5
                        });
                        let control = i.mmdControl();
                        setTimeout(() => {
                            control.play();
                        }, 3000);
                        this.setRenderFun("mmdUpdate", (() => {
                            i.render();
                        }));
                    }
                },
                mounted() {
                    // this.physicsTest()
                    // this.normalTest()
                    this.MMdTest();
                }
            })
                .initStats(this.$refs["Stats"])
                .setOrbitControlsCamera()
                .GuiControl()
                .ambient({
                    gui: true,
                    color: "#0c0c0c",
                    name: "ambient"
                })
                .directional({
                    gui: true,
                    helper: false,
                    color: "#ffffff",
                    Shadow: false,
                    position: {
                        x: -40,
                        y: 60,
                        z: -10
                    }
                })
                .expandPlugin({
                    mmd: MMD
                })
                .script();
        }
    }
</script>

<style scoped>

</style>
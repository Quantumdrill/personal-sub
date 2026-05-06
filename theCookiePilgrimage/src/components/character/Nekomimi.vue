<script setup>

import * as THREE from "three"
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
// import textureLoader from 'three/examples/jsm/loaders/TextureLoader.js'
import {gsap} from "gsap"
import MotionPathPlugin from "gsap/MotionPathPlugin"
gsap.registerPlugin(MotionPathPlugin)
import {onMounted, useTemplateRef, watch, ref} from "vue"
import { LoadingManager } from "three"
import { loadCharAnim, loadCharSkm, animTransition, charMove, charMoveDuration, getBoneIndex } from "../../functions/char"
import { orientConstraint, pointConstraint, poleVectorConstraint, aimConstraint, create3JointIK } from "../../functions/rig"

const scene = new THREE.Scene()
const canvas = useTemplateRef("canvasDom")
let renderer
const scrnRatio = window.innerWidth/window.innerHeight
let props = defineProps(["animSequenceProp", "parentComponent"])
let emit = defineEmits(["nextButtonActivated", "nekomimiPosUpdate", "screenShake", "hpBarUpdate", "nekomimiLoadingUpdate"])

//fps
const fps = 8
let accumulatedDelta = 0
const clock = new THREE.Timer()

//camera
let camFov = 15
let camDist = 180 
const cam = new THREE.PerspectiveCamera(camFov, window.innerWidth/window.innerHeight, 0.1, 1000)
cam.position.set(0,0,camDist)

//lights
const backLightFront = new THREE.DirectionalLight(0xffffff, 2)
backLightFront.position.set(50, 20, 20)
const backLightBack = new THREE.DirectionalLight(0xffffff, 1)
backLightBack.position.set(-50, 10, 20)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
scene.add(cam,backLightFront,backLightBack,ambientLight)

//loader
const loadingManager = new LoadingManager()
const modelLoader = new FBXLoader(loadingManager)
const texLoader = new THREE.TextureLoader(loadingManager)

//characters
const nekomimi = {
    name: "Nekomimi",
    mesh: null,
    skm: null,
    skeleton: null,
    bones: {},
    animClips: {
    },
    animActions: {
    },
    mixer: null,
    currentAnim: "stage33After",
    animPlaying: false,
    localVars: {
        stage51: {
            punchStart: false,
            punchPeriod: 3,
            returnPeriod1: 3,
            returnPeriod2: 14,
            currentPunchProgess: 0,
            parryWindow: false,
            parried: false,
            parryListener: null,
            tl: null,
        }
    },
    reactiveRig: false,
    anims: {
        x: 0,
        y: 0,
    },
    loaded: false,
    textures: {
        smile: null,
        angry: null,
    },
}
const nrar = {
    name: "NekomimiRightArmRef",
    mesh: null,
    skm: null,
    skeleton: null,
    bones: {},
    reactiveRig: false,
    anims: {}
}
let unitToVw = Math.tan(camFov/2/180*Math.PI)*camDist / 25 // make sure the character position unit reacts to camera zoom and vw
let unitToVh = unitToVw/scrnRatio
const animArr = ["default", "stage33", "stage33After", "punch", "punchForTesting", "TPoseForTesting", "stage51Init", "stage51Wait", "parried"]
const animArrOnce = ["stage33", "stage51Init", "parried", "punch"] // animations that should only play once

//reactive related
let mousePos = {
    x: 0,
    y: 0,
}

onMounted(() => {
    loadingManager.abort()

    renderer = new THREE.WebGLRenderer({antialias:true,canvas:canvas.value,alpha: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    document.addEventListener("mousemove", (e) => {
        mousePos.x = e.clientX
        mousePos.y = e.clientY
    })
    
    loadCharSkm("Nekomimi", nekomimi, modelLoader)
    for (const anim of animArr){
        loadCharAnim("Nekomimi", anim, nekomimi, modelLoader)
    }
    
    loadCharSkm("NekomimiRightArmRef", nrar, modelLoader)

    nekomimi.textures.smile  = texLoader.load("./src/assets/imgs/Nekomimi_smile.png")
    nekomimi.textures.angry = texLoader.load("./src/assets/imgs/Nekomimi_angry.png")

    loadingManager.onLoad = () => {
        nekomimiLoadedInitializationCheck()
    }
})

function nekomimiLoadedInitializationCheck(){
    if (
        nekomimi.mesh &&
        nekomimi.skm &&
        nekomimi.skeleton &&
        nrar.mesh &&
        nrar.skm &&
        nrar.skeleton &&
        Object.keys(nekomimi.animClips).length === animArr.length
    ){
        nekomimiLoadedInitialization()
    } else {
        requestAnimationFrame(nekomimiLoadedInitializationCheck)
    }
}

function nekomimiLoadedInitialization(){
    emit("nekomimiLoadingUpdate")
    cancelAnimationFrame(nekomimiLoadedInitializationCheck)

    nekomimi.loaded = true

    nekomimi.skm.material = new THREE.MeshLambertMaterial({color: 0xffffff})
    nekomimi.mesh.scale.set(scrnRatio, scrnRatio, scrnRatio) // char scales in proportion to vw

    nrar.skm.material = new THREE.MeshLambertMaterial({color: 0xff0000})
    nrar.mesh.scale.set(scrnRatio, scrnRatio, scrnRatio) // char scales in proportion to vw

    
    scene.add(nekomimi.mesh)
    // scene.add(nrar.mesh)

    const helper = new THREE.SkeletonHelper( nekomimi.mesh );
    // scene.add( helper );
    const helper2 = new THREE.SkeletonHelper( nrar.mesh );
    // scene.add( helper2 );

    const cube = new THREE.Mesh(new THREE.BoxGeometry(10,10,10), new THREE.MeshBasicMaterial({color: 0x00ff00}))
    // scene.add(cube)

    nekomimi.mixer = new THREE.AnimationMixer(nekomimi.mesh)
    for (const anim of animArr){
        nekomimi.animActions[anim] = nekomimi.mixer.clipAction(nekomimi.animClips[anim])
    }
    for (const anim of animArrOnce){
        nekomimi.animActions[anim].loop = THREE.LoopOnce
    }

    nekomimi.animActions.stage33After.play()
    
    nekomimiCharInitialization()

    if (props.parentComponent == "stage51"){
        // get bones
        nekomimi.bones.head = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigneck_head_C0_JT")]
        nekomimi.bones.upperSpine = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigspine_1_C0_JT")]
        nekomimi.bones.clavicle = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigspine_2_C0_JT")]
        nekomimi.bones.shoulder = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigarm_0_R0_JT")]
        nekomimi.bones.upperArmRollMid = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigarm_1_R0_JT")]
        nekomimi.bones.upperArmRollEnd = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigarm_2_R0_JT")]
        nekomimi.bones.elbow = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigarm_3_R0_JT")]
        nekomimi.bones.lowerArmRollStart = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigarm_4_R0_JT")]
        nekomimi.bones.lowerArmRollMid = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigarm_5_R0_JT")]
        nekomimi.bones.lowerArmRollEnd = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigarm_6_R0_JT")]
        nekomimi.bones.hand = nekomimi.skeleton.bones[getBoneIndex(nekomimi.skeleton, "Nekomimi_rigarm_end_R0_JT")]

        nrar.bones.shoulderParent = nrar.skeleton.bones[getBoneIndex(nrar.skeleton, "joint0")]
        nrar.bones.shoulder = nrar.skeleton.bones[getBoneIndex(nrar.skeleton, "joint1")]
        nrar.bones.elbow = nrar.skeleton.bones[getBoneIndex(nrar.skeleton, "joint2")]
        nrar.bones.hand = nrar.skeleton.bones[getBoneIndex(nrar.skeleton, "joint3")]
        nrar.bones.ikHandle = nrar.skeleton.bones[getBoneIndex(nrar.skeleton, "ikHandle")]
        nrar.bones.rootBone = nrar.skeleton.bones[getBoneIndex(nrar.skeleton, "root")]
        nrar.bones.IkSolver = create3JointIK(nrar.skm,nrar.skeleton,["ikHandle","joint3","joint2","joint1"])

        nrar.pv = new THREE.Object3D()
        nrar.pv.position.y = 10
        nrar.pv.position.x = -300
        nrar.pv.position.z = -200
        cube.position.copy(nrar.pv.position)
        // mouse interaction
        nrar.anims.charToCamDist = cam.position.z
        nrar.anims.charToPointerHoverDist = 40
        nrar.anims.planeToCamDist = nrar.anims.charToCamDist - nrar.anims.charToPointerHoverDist
        nrar.anims.wristToFingerTipDist = 1.9
        nrar.anims.camHeight = cam.position.y
        nrar.anims.curserToPointerMultiplier = Math.tan(camFov/2/180*Math.PI)*(nrar.anims.planeToCamDist)
        nrar.anims.wristRefBaseZ = 0
        nrar.anims.wristRefBase = new THREE.Vector3(-2,0,nrar.anims.wristRefBaseZ) // a point in the back of the character, the line between the fingertip and this is used to determine the orientation and the position of the wrist
        nrar.anims.travelProgress = 0 //percentage of the travel from wristRefBase to pointerVector
        nrar.anims.pointerZbase = nrar.anims.charToPointerHoverDist
        nrar.anims.pointerZ = nrar.anims.pointerZbase
        nrar.anims.pointerVector = new THREE.Vector3(0,0,nrar.anims.pointerZ)
        document.addEventListener("mousemove", (e) => {
            nrar.anims.x = (e.clientX/window.innerWidth*2-1)*scrnRatio // get x position -1*ratio to 1*ratio
            nrar.anims.y = -(e.clientY/window.innerHeight*2-1) // get y position: -1 to 1
            nrar.anims.pointerY = nrar.anims.y*nrar.anims.curserToPointerMultiplier + nrar.anims.camHeight
            nrar.anims.pointerX = nrar.anims.x*nrar.anims.curserToPointerMultiplier
            nrar.anims.pointerVector.setComponent(0,nrar.anims.pointerX)
            nrar.anims.pointerVector.setComponent(1,nrar.anims.pointerY)

            // nrar.pv.position.x = (nrar.anims.x-1)*2
            // nrar.pv.position.z = (nrar.anims.x+2)*3
            // nrar.pv.position.y = (nrar.anims.y+nrar.anims.x)*5

            nekomimi.anims.x = (e.clientX/window.innerWidth*2-1)*scrnRatio // get x position -1*ratio to 1*ratio
            nekomimi.anims.y = -(e.clientY/window.innerHeight*2-1) // get y position: -1 to 1
        })
    }

    watch(()=>props.animSequenceProp, () => {
        nekomimiAnimSequences[props.animSequenceProp]()
    })
    animTick()
}

//reactive related
function reactiveFK(){
    nekomimi.bones.upperSpine.rotation.z += nekomimi.anims.x/5+0.1
    nekomimi.bones.upperSpine.rotation.y += nekomimi.anims.x/15+0.2
    nekomimi.bones.upperSpine.rotation.x += nekomimi.anims.y/20
    nekomimi.bones.clavicle.rotation.y += nekomimi.anims.x/15
    nekomimi.bones.clavicle.rotation.x += nekomimi.anims.y/15+0.1
    nekomimi.bones.clavicle.rotation.z += nekomimi.anims.x/15
    nekomimi.bones.head.rotation.x = nekomimi.anims.y/20+0.1
    nekomimi.bones.head.rotation.y = nekomimi.anims.x/20
    nekomimi.bones.head.rotation.z = nekomimi.anims.y/30
    nrar.anims.wristRefBase.x = nekomimi.anims.x*8-5

    // to nrar
    let claviclePos = new THREE.Vector3().copy(nekomimi.bones.clavicle.getWorldPosition(new THREE.Vector3()))
    let shoulderPos = new THREE.Vector3().copy(nekomimi.bones.shoulder.getWorldPosition(new THREE.Vector3()))
    let clavicleRot = nekomimi.bones.clavicle.getWorldQuaternion(new THREE.Quaternion())
    pointConstraint(claviclePos,nrar.bones.shoulderParent,nrar.bones.rootBone)
    orientConstraint(clavicleRot,nrar.bones.shoulderParent,nrar.bones.rootBone)
    pointConstraint(shoulderPos,nrar.bones.shoulder,nrar.bones.shoulderParent)
}

function reactiveIKUpdate(){
    nekomimi.bones.lowerArmRollStart.rotation.set(0,0,0)
    nekomimi.bones.lowerArmRollStart.position.set(0,0,0)
    nekomimi.bones.lowerArmRollStart.position.x = -0.143
    aimConstraint(nekomimi.bones.shoulder,nrar.bones.elbow,new THREE.Vector3(0,1,0),nekomimi.bones.clavicle,false,new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,-1))
    aimConstraint(nekomimi.bones.elbow,nrar.bones.hand,new THREE.Vector3(0,1,0),nekomimi.bones.upperArmRollEnd,false,new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,-1))
}

function wristPosUpdate(){
    nrar.anims.wristRefLine = new THREE.Vector3().subVectors(nrar.anims.pointerVector,nrar.anims.wristRefBase) // line from wristRefBase to the fingertip
    // nrar.anims.fingerTipToWristVec = new THREE.Vector3().copy(nrar.anims.wristRefLine).setLength(nrar.anims.wristToFingerTipDist)
    // nrar.anims.wristToFingerTipVec = new THREE.Vector3().copy(nrar.anims.fingerTipToWristVec).negate()
    // nrar.anims.wristCurrentZ = nrar.bones.hand.getWorldPosition(new THREE.Vector3()).z
    // nrar.anims.newWristPos = new THREE.Vector3().addVectors(nrar.anims.pointerVector,nrar.anims.fingerTipToWristVec)
    nrar.anims.newWristPos = new THREE.Vector3().addVectors(nrar.anims.wristRefLine.clone().multiplyScalar(nrar.anims.travelProgress),nrar.anims.wristRefBase)
    pointConstraint(nrar.anims.newWristPos,nrar.bones.ikHandle,nrar.bones.rootBone)
    
    // nrar.anims.wristUpV = new THREE.Vector3().crossVectors(new THREE.Vector3(-1,0,0),nrar.anims.wristToFingerTipVec).normalize()
    // aimConstraint(nrar.bones.hand,nrar.anims.wristToFingerTipVec,nrar.anims.wristUpV,nrar.bones.elbow,true,new THREE.Vector3(-7,1,0.5),nrar.anims.wristUpV)
}

function punchCycleUpdate(){
    if (nekomimi.localVars.stage51.punchStart){
        if (nekomimi.localVars.stage51.currentPunchProgess === 0){
            let tl = gsap.timeline()
            tl.to(nrar.anims, {
                travelProgress: 1, 
                duration: nekomimi.localVars.stage51.punchPeriod*0.125, 
                ease: "power2.in",
            })
            tl.to(nrar.anims, {
                travelProgress: 0.9, 
                duration: nekomimi.localVars.stage51.returnPeriod1*0.125, 
                ease: "power1.in",
            })
            tl.to(nrar.anims, {
                travelProgress: 0, 
                duration: nekomimi.localVars.stage51.returnPeriod2*0.125, 
                ease: "power1.out",
            })
            nekomimi.localVars.stage51.currentPunchProgess += 1
        } else if (nekomimi.localVars.stage51.currentPunchProgess === nekomimi.localVars.stage51.punchPeriod+nekomimi.localVars.stage51.returnPeriod1+nekomimi.localVars.stage51.returnPeriod2){
            nekomimi.localVars.stage51.currentPunchProgess = 0
        } else {
            nekomimi.localVars.stage51.currentPunchProgess += 1
        }
    } else {
        nekomimi.localVars.stage51.currentPunchProgess = 0
    }
}

function reactiveRig(){
    reactiveFK()
    
    punchCycleUpdate()
    wristPosUpdate()
    poleVectorConstraint(nrar.bones.ikHandle,nrar.bones.hand,nrar.bones.elbow,nrar.bones.shoulder,nrar.pv,nrar.bones.shoulderParent,new THREE.Euler())
    nrar.bones.IkSolver.update()

    reactiveIKUpdate()
}

function globalUpdatePerFrame(){
    nekomimi.mixer.update(1/fps)

    // place after mixer update to overwrite animated posture
    if (nekomimi.reactiveRig&&nekomimi.loaded){
        reactiveRig()
    }

    renderer.render(scene,cam)
}

function animTick(){
    clock.update()
    let delta = clock.getDelta()
    accumulatedDelta += delta
    if (accumulatedDelta >= 1/fps){ //enable 8fps for all anim clips and transitions
        accumulatedDelta = 0
        globalUpdatePerFrame()
    }

    requestAnimationFrame(animTick)
}

function nekomimiCharInitialization(){
    switch (props.parentComponent){
        case "stage33":
            camFov = 15
            camDist = 180 
            nekomimi.mesh.position.set(0*unitToVw, 200*unitToVh, 0)
            cam.position.set(0,0,camDist)
            cam.fov = camFov
            cam.updateProjectionMatrix()
            unitToVw = Math.tan(camFov/2/180*Math.PI)*camDist / 25
            unitToVh = unitToVw/scrnRatio
            nekomimi.skm.material.map = nekomimi.textures.angry
            break
        case "stage51":
            camFov = 60 //60
            camDist = 50 
            nekomimi.mesh.position.set(0*unitToVw, -50*unitToVh+24*unitToVw,0)
            cam.position.set(0,0,camDist)
            cam.fov = camFov
            cam.updateProjectionMatrix()
            unitToVw = Math.tan(camFov/2/180*Math.PI)*camDist / 25
            unitToVh = unitToVw/scrnRatio
            nekomimi.skm.material.map = nekomimi.textures.angry
            nekomimiAnimSequences["stage51Init"]()
            document.addEventListener("click", (e) => {
                if (nekomimi.localVars.stage51.parryWindow){
                    nekomimi.localVars.stage51.parried = true
                    charMove(nekomimi, "parried", 0, 0)
                    nekomimi.localVars.stage51.punchStart = false
                    nekomimi.localVars.stage51.currentPunchProgess = 0
                    nekomimi.localVars.stage51.parryWindow = false
                    nekomimi.localVars.stage51.tl.kill()
                    gsap.delayedCall(charMoveDuration(nekomimi, "parried", 0, 0)-0.125, () => {
                        nekomimi.localVars.stage51.currentPunchProgess = 0
                        nekomimi.animPlaying = false
                        nekomimiAnimSequences["stage51OnePunch"]()
                    })
                    emit("hpBarUpdate")
                }
            })
            break
        default:
            break
    }
}

const nekomimiAnimSequences = {
    stage33Init: ()=>{
        if (!nekomimi.animPlaying){
            let tl = gsap.timeline()
            nekomimi.animPlaying = true
            props.animSequenceProp = null
            tl.call(() => {
                nekomimi.mesh.position.set(0*unitToVw, -50*unitToVh+25*unitToVw,0)
                charMove(nekomimi, "stage33", 0, 0, false, 0)
            }, [], "+=0.5")
            tl.call(() => {
                emit("nekomimiPosUpdate", 2)
            }, [], `+=2.6`)
            tl.call(() => {
                charMove(nekomimi, "stage33After", 0, 0)
                nekomimi.skm.material.map = nekomimi.textures.smile
            }, [], `+=${charMoveDuration(nekomimi, "stage33", 0, 0)-2.6}`)
        }
    },
    stage51Init: ()=>{
        if (!nekomimi.animPlaying){
            let tl = gsap.timeline()
            nekomimi.animPlaying = true
            props.animSequenceProp = null
            tl.call(() => {
                charMove(nekomimi, "stage51Init", 0, 0)
                nekomimi.animPlaying = false
            }, [], "+=0.5")
            tl.call(() => {
                emit("nekomimiPosUpdate", 4)
            }, [], `+=${charMoveDuration(nekomimi, "stage51Init", 0, 0)-0.9}`)
            tl.call(() => {
                charMove(nekomimi, "stage51Wait", 0, 0)
            }, [], `+=0.9`)
        }
    },
    stage51OnePunch: ()=>{
        if (!nekomimi.animPlaying){
            if (nekomimi.localVars.stage51.tl) {
                nekomimi.localVars.stage51.tl.kill()
            }
            nekomimi.localVars.stage51.tl = gsap.timeline()
            nekomimi.animPlaying = true
            props.animSequenceProp = null
            nekomimi.reactiveRig = true
            nrar.reactiveRig = true
            nekomimi.localVars.stage51.parried = false
            nekomimi.localVars.stage51.punchStart = true
            nekomimi.localVars.stage51.parryWindow = false
            nekomimi.localVars.stage51.tl.call(() => {
                charMove(nekomimi, "punch", 0, 0, false, 0)
            }, [], "+=0.125")
            nekomimi.localVars.stage51.tl.call(() => {
                nekomimi.localVars.stage51.parryWindow = true
            }, [], `+=${(nekomimi.localVars.stage51.punchPeriod-1)*0.125}`)
            nekomimi.localVars.stage51.tl.call(() => {
                emit("screenShake")
            }, [], `+=0.125`)
            nekomimi.localVars.stage51.tl.call(() => {
                nekomimi.localVars.stage51.parryWindow = false
            }, [], `+=0.25`)
            nekomimi.localVars.stage51.tl.call(() => {
                if (!nekomimi.localVars.stage51.parried){
                    nekomimi.localVars.stage51.currentPunchProgess = 0
                    nekomimi.animPlaying = false
                    nekomimiAnimSequences["stage51OnePunch"]()
                    console.log("end")
                }
            }, [], `+=${(nekomimi.localVars.stage51.returnPeriod1+nekomimi.localVars.stage51.returnPeriod2-3)*0.125}`)
        }
    },
    stage51End: ()=>{
        let tl = gsap.timeline()
        tl.to(nekomimi.mesh.position, {
            y: "-=100vh",
            duration: 1,
            ease: "none",
        }, "+=0.3")
        tl.call(() => {
            emit("nekomimiPosUpdate", 5)
        }, [])
    },
}

</script>
<template>
    <canvas id="canvas" ref="canvasDom"></canvas>
</template>
<style scoped>

#canvasContainer{
    width: 100vw;
    height: 100vh;
    position: fixed;
    display: flex;
    justify-content: center;
    align-items: center;
}

#canvas{
    width: 100vw;
    height: 100vh;
    position: fixed;
}

</style>
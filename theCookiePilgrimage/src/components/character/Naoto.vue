<script setup>

import * as THREE from "three"
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import {gsap} from "gsap"
import MotionPathPlugin from "gsap/MotionPathPlugin"
gsap.registerPlugin(MotionPathPlugin)
import {onMounted, useTemplateRef, watch, ref} from "vue"
import { LoadingManager } from "three"
import { loadCharAnim, loadCharSkm, animTransition, charMove, charMoveDuration, getBoneIndex } from "../../functions/char"

const scene = new THREE.Scene()
const canvas = useTemplateRef("canvasDom")
let renderer
const scrnRatio = window.innerWidth/window.innerHeight
console.log(scrnRatio)
const props = defineProps(["animSequenceProp", "parentComponent", "naotoLocalVarsProp"])
const emit = defineEmits(["nextButtonActivated", "naotoPosUpdate", "operationButtonOperation", "popupPushedStateUpdate", "naotoLoadingUpdate"])

//fps
const fps = 8
let accumulatedDelta = 0
const clock = new THREE.Timer()

//camera
let cam
let unitToVw
let unitToVh
if (props.parentComponent === "stage7") {
    const camFov = 20
    const camDist = 800
    const camZoom = scrnRatio/2.2
    cam = new THREE.PerspectiveCamera(
        camFov,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    cam.zoom = camZoom
    cam.position.set(0, 0, camDist)
    unitToVw = Math.tan(camFov / 2 / 180 * Math.PI) * camDist / 25
    unitToVh = unitToVw / scrnRatio
} else {
    const camZoomFactor = window.innerWidth * 0.0032
    cam = new THREE.OrthographicCamera(
        -window.innerWidth / camZoomFactor,
        window.innerWidth / camZoomFactor,
        window.innerHeight / camZoomFactor,
        -window.innerHeight / camZoomFactor,
        -1000,
        1000
    )
    cam.position.set(0, 0, 50)
    unitToVw = 50 / 8
    unitToVh = unitToVw / scrnRatio
}

//lights
const backLightFront = new THREE.DirectionalLight(0xffffff, 2)
backLightFront.position.set(50, 20, -50)
const backLightBack = new THREE.DirectionalLight(0xffffff, 1)
backLightBack.position.set(-50, 10, -50)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
scene.add(cam,backLightFront,backLightBack,ambientLight)

//loader
const loadingManager = new LoadingManager()
const modelLoader = new FBXLoader(loadingManager)

//characters
const naoto = {
    name: "Naoto",
    mesh: null,
    skm: null,
    skeleton: null,
    bones: {},
    animClips: {
    },
    animActions: {
    },
    mixer: null,
    currentAnim: "idle",
    animPlaying: false,
    localVars: {
        stage24Appearance: false,
    },
    reactiveRig: false,
}
const cookie = {
    name: "Cookie",
    mesh: null,
    skm: null,
    skeleton: null,
    bones: {},
    animClips: {
    },
    animActions: {
    },
    mixer: null,
    currentAnim: "stage7Idle",
    animPlaying: false,
}

const animArr = ["run", "idle", "leap", "drop", "point", "turn", "stage1", "idea", "push", "walk", "leapReady", "yes", "no", "fear", "stabbed", "stage7Idle", "stage7"]
const animArrOnce = ["leap", "drop", "point", "turn", "stage1", "idea", "leapReady", "stabbed", "stage7"] // animations that should only play once
const animArrClamped = ["stage1", "stabbed", "stage7"] // animations that should only play once and clamp when finished

//misc
let mousePos = {
    x: 0,
    y: 0,
}

onMounted(() => {
    renderer = new THREE.WebGLRenderer({antialias:true,canvas:canvas.value,alpha: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    document.addEventListener("mousemove", (e) => {
        mousePos.x = e.clientX
        mousePos.y = e.clientY
    })
    
    loadCharSkm("Naoto", naoto, modelLoader)
    for (const anim of animArr){
        loadCharAnim("Naoto", anim, naoto, modelLoader)
    }

    //cookie
    loadCharSkm("Cookie", cookie, modelLoader)
    loadCharAnim("Cookie", "stage7Idle", cookie, modelLoader)
    loadCharAnim("Cookie", "stage7", cookie, modelLoader)
    
    loadingManager.onLoad = () => {
        emit("naotoLoadingUpdate")
        
        naoto.skm.material = new THREE.MeshLambertMaterial({color: 0xffffff})
        // get bones
        naoto.bones.head = naoto.skeleton.bones[getBoneIndex(naoto.skeleton, "Naoto_rigneck_head_C0_JT")]
        naoto.bones.upperSpine = naoto.skeleton.bones[getBoneIndex(naoto.skeleton, "Naoto_rigspine_1_C0_JT")]

        scene.add(naoto.mesh)

        naoto.mixer = new THREE.AnimationMixer(naoto.mesh)
        for (const anim of animArr){
            naoto.animActions[anim] = naoto.mixer.clipAction(naoto.animClips[anim])
        }
        for (const anim of animArrOnce){
            naoto.animActions[anim].loop = THREE.LoopOnce
        }
        for (const anim of animArrClamped){
            naoto.animActions[anim].clampWhenFinished = true
        }

        naoto.animActions.stage7Idle.loop = THREE.LoopPingPong
        naoto.animActions.idle.play()

        naotoCharInitialization()


        if (props.parentComponent === "stage7"){
            //cookie
            cookie.skm.material = new THREE.MeshLambertMaterial({color: 0xffffff})
            cookie.skm.frustumCulled = false
            scene.add(cookie.mesh)
            cookie.mixer = new THREE.AnimationMixer(cookie.mesh)
            cookie.animActions.stage7Idle = cookie.mixer.clipAction(cookie.animClips.stage7Idle)
            cookie.animActions.stage7Idle.loop = THREE.LoopPingPong
            cookie.animActions.stage7 = cookie.mixer.clipAction(cookie.animClips.stage7)
            cookie.animActions.stage7.loop = THREE.LoopOnce
            cookie.animActions.stage7.clampWhenFinished = true
            cookie.animActions.stage7Idle.play()
        }


        watch(()=>props.animSequenceProp, () => {
            naotoAnimSequences[props.animSequenceProp]()
        })
        animTick()
    }
})

function globalUpdatePerFrame(){
    naoto.mixer.update(1/fps)
    if (props.parentComponent === "stage7"){
        cookie.mixer.update(1/fps)
    }

    // place after mixer update to overwrite animated posture
    if (naoto.reactiveRig){
        reactiveRig()
    }

    cam.updateProjectionMatrix()
    renderer.render(scene,cam)
}

function reactiveRig(){
    let charToMouseAngle = Math.atan((window.innerHeight-mousePos.y-10*window.innerHeight/100)/(mousePos.x-20*window.innerWidth/100))
    let headRotationX
    let upperSpineRotationX
    if (window.innerHeight-mousePos.y-10*window.innerHeight/100<0){
        headRotationX = 0
        upperSpineRotationX = 0
    } else if (charToMouseAngle<80/180*Math.PI&&charToMouseAngle>0){
        headRotationX = charToMouseAngle*0.7
        upperSpineRotationX = charToMouseAngle/4-0.1
    } else if (charToMouseAngle>80/180*Math.PI||charToMouseAngle<0){
        headRotationX = 80/180*Math.PI*0.7
        upperSpineRotationX = 80/180*Math.PI/4-0.1
    } 
    naoto.bones.head.rotation.x = headRotationX
    naoto.bones.upperSpine.rotation.x = upperSpineRotationX
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

function naotoCharInitialization(){
    switch (props.parentComponent){
        case "stage1": 
            naoto.mesh.position.set(-52*unitToVw,-5*unitToVh,0)
            break
        case "stage21":
            naoto.mesh.rotation.y = Math.PI/2   
            naoto.mesh.position.set(-36*unitToVw,-5*unitToVh,0)
            break
        case "stage22":
            naoto.mesh.rotation.y = Math.PI/2   
            naoto.mesh.position.set(-36*unitToVw,-5*unitToVh,0)
            break
        case "stage24":
            naoto.mesh.rotation.y = Math.PI/2   
            naoto.mesh.position.set(-40*unitToVw,30*unitToVh,0)
            break
        case "stage31":
            naoto.mesh.rotation.y = Math.PI/2   
            naoto.mesh.position.set(-20*unitToVw,10*unitToVh,0)
            break
        case "stage32":
            naoto.mesh.rotation.y = Math.PI/2   
            naoto.mesh.position.set(-27*unitToVw,30*unitToVh,0)
            break
        case "popupsSubmarine":
            naoto.mesh.rotation.y = Math.PI/2   
            naoto.mesh.position.set(0*unitToVw, 20*unitToVh,0)
            cam.left = -1/(0.0032*100/15)
            cam.right = 1/(0.0032*100/15)
            cam.top = 1/(0.0032*100/15)/scrnRatio
            cam.bottom = -1/(0.0032*100/15)/scrnRatio
            cam.updateProjectionMatrix()
            break
        case "stage33":
            naoto.reactiveRig = false
            naoto.mesh.rotation.y = Math.PI/2   
            naoto.mesh.position.set(-55*unitToVw, -40*unitToVh,0)
            break
        case "stage7": 
            naoto.mesh.position.set(0*unitToVw, -20*unitToVh,0)
            cookie.mesh.position.set(0*unitToVw, -20*unitToVh,0)
            charMove(naoto, "stage7Idle", 0, 0, false, 1)
            break
        default:
            break
    }
}

const naotoAnimSequences = {
    stage1: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            tl.call(() => {
                charMove(naoto, "stage1", 0, 0)
            }, [], "+=0")
        }
    },
    stage21NextLevel: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            tl.call(() => {
                charMove(naoto, "run", 8, 0)
            }, [], "+=0.5")
            tl.call(() => {
                charMove(naoto, "leap", 18, 7/scrnRatio, true, 1)
            }, [], `+=${charMoveDuration(naoto, "run", 8, 0)}`)
            tl.call(() => {
                charMove(naoto, "leap", 20, 10/scrnRatio, true, 1)
            }, [], `+=${charMoveDuration(naoto, "leap", 18, 8/scrnRatio, true)}`)
            tl.call(() => {
                charMove(naoto, "leap", 18, 8/scrnRatio, true, 1)
            }, [], `+=${charMoveDuration(naoto, "leap", 20, 8/scrnRatio, true)}`)
            tl.call(() => {
                charMove(naoto, "run", 6, 0)
            }, [], `+=${charMoveDuration(naoto, "leap", 18, 8/scrnRatio, true)}`)
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
                naoto.animPlaying = false
                emit("nextButtonActivated")
            }, [], `+=${charMoveDuration(naoto, "run", 8, 0)}`)
        }
    },
    stage22NextLevel: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            tl.call(() => {
                charMove(naoto, "run", 8, 0)
            }, [], "+=0.5")
            tl.call(() => {
                charMove(naoto, "leap", 18, 0/scrnRatio, true, 1)
            }, [], `+=${charMoveDuration(naoto, "run", 8, 0)}`)
            tl.call(() => {
                charMove(naoto, "run", 20, 0)
            }, [], `+=${charMoveDuration(naoto, "leap", 20, 8/scrnRatio, true)}`)
            tl.call(() => {
                charMove(naoto, "leap", 20, 0/scrnRatio, true, 1)
            }, [], `+=${charMoveDuration(naoto, "run", 20, 0)}`)
            tl.call(() => {
                charMove(naoto, "run", 6, 0)
            }, [], `+=${charMoveDuration(naoto, "leap", 20, 8/scrnRatio, true)}`)
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
                naoto.animPlaying = false
                emit("nextButtonActivated")
            }, [], `+=${charMoveDuration(naoto, "run", 8, 0)}`)
        }
    },
    stage24InitDrop: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            emit("operationButtonOperation", false)
            tl.call(() => {
                charMove(naoto, "drop", 0, -30/scrnRatio)
            }, [], "+=0")
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
                emit("naotoPosUpdate", 2)
            }, [], `+=${charMoveDuration(naoto, "drop", 0, -30/scrnRatio)}`)
            tl.call(() => {
                charMove(naoto, "point", 0, 0)
            }, [], `+=0.5`)
            tl.call(() => {
                emit("operationButtonOperation", true)
                charMove(naoto, "run", 10, 0)
            }, [], `+=${charMoveDuration(naoto, "point", 0, 0)}`)
            tl.call(() => {
                charMove(naoto, "leap", 34, 0)
            }, [], `+=${charMoveDuration(naoto, "run", 10, 0)}`)
            tl.call(() => {
                if (naoto.localVars.stage24Appearance){
                    charMove(naoto, "leap", 30, 0)
                    tl.call(() => {
                        if (!naoto.localVars.stage24Appearance){
                            emit("operationButtonOperation", false)
                            charMove(naoto, "run", 8, 0)
                            tl.call(() => {
                                charMove(naoto, "idle", 0, 0)
                            }, [], `+=${charMoveDuration(naoto, "run", 8, 0)}`)
                            tl.call(() => {
                                charMove(naoto, "turn", 0, 0)
                            }, [], `+=0.2`)
                            tl.call(() => {
                                charMove(naoto, "idle", 0, 0)
                                emit("operationButtonOperation", true)
                                emit("naotoPosUpdate", 3)
                                naoto.animPlaying = false // end of sequence
                            }, [], `+=${charMoveDuration(naoto, "turn", 0, 0)}`)
                            
                        } else {
                            charMove(naoto, "drop", 30, -40, false, 4)
                            tl.call(() => {
                                emit("resetScreen")
                            }, [], `+=${charMoveDuration(naoto, "drop", 30, -40, false, 4)}`)
                        }
                    }, [], `+=${charMoveDuration(naoto, "leap", 30, 0)-0.25}`)
                    
                } else {
                    charMove(naoto, "drop", 30, -40, false, 4)
                    tl.call(() => {
                        emit("resetScreen")
                    }, [], `+=${charMoveDuration(naoto, "drop", 30, -40, false, 4)}`)
                }
            }, [], `+=${charMoveDuration(naoto, "leap", 30, 0)-0.25}`)
        }
    },
    stage24SecondDrop: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            emit("operationButtonOperation", false)
            charMove(naoto, "drop", 0, -35/scrnRatio)
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
                emit("naotoPosUpdate", 4)
            }, [], `+=${charMoveDuration(naoto, "drop", 0, -35/scrnRatio)}`)
            tl.call(() => {
                charMove(naoto, "point", 0, 0)
            }, [], `+=0.5`)
            tl.call(() => {
                charMove(naoto, "run", -8, 0)
            }, [], `+=${charMoveDuration(naoto, "point", 0, 0)}`)
            tl.call(() => {
                emit("operationButtonOperation", true)
                charMove(naoto, "leap", -46, 0)
            }, [], `+=${charMoveDuration(naoto, "run", -8, 0)}`)
            tl.call(() => {
                if (naoto.localVars.stage24Appearance){
                    canvas.value.style.display = "none"
                    emit("resetScreen")
                }
            }, [], `+=0.5`)
            tl.call(() => {
                if (naoto.localVars.stage24Appearance){
                    tl.call(() => {
                        charMove(naoto, "idle", 0, 0)
                        emit("nextButtonActivated")
                        naoto.animPlaying = false // end of sequence
                    }, [], `+=0.25`)
                } else {
                    charMove(naoto, "drop", -20, -20, false, 4)
                    tl.call(() => {
                        emit("resetScreen")
                    }, [], `+=${charMoveDuration(naoto, "drop", 30, -40, false, 4)}`)
                }
            }, [], `+=${charMoveDuration(naoto, "leap", -48, 0)-0.75}`)
        }
    },
    stage24AppearanceCheck: ()=>{
        naoto.localVars.stage24Appearance = props.naotoLocalVarsProp.stage24Appearance
    },
    stage31Go: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            tl.call(() => {
                charMove(naoto, "idea", 0, 0)
            }, [], "+=0.5")
            tl.call(() => {
                charMove(naoto, "walk", 6, 0)
            }, [], `+=${charMoveDuration(naoto, "idea", 0, 0)}`)
            tl.call(() => {
                charMove(naoto, "push", 20, 0, false, 3)
            }, [], `+=${charMoveDuration(naoto, "walk", 6, 0)}`)
            tl.call(() => {
                emit("popupPushedStateUpdate", "pushed")
            }, [], `+=0.3`)
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
            }, [], `+=${charMoveDuration(naoto, "push", 20, 0, false, 3)-0.3}`)
            tl.call(() => {
                emit("popupPushedStateUpdate", "dropping")
            }, [], `+=0.3`)
            tl.call(() => {
                charMove(naoto, "leapReady", 0, 0, false, 1)
            }, [], `+=0.5`)
            tl.call(() => {
                charMove(naoto, "leap", 18, -50/scrnRatio+15, true)
            }, [], `+=${charMoveDuration(naoto, "leapReady", 0, 0, false, 1)}`)
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
                naoto.animPlaying = false
                emit("nextButtonActivated")
            }, [], `+=${charMoveDuration(naoto, "leap", 12, -50/scrnRatio+15, true)}`)
        }
    },
    stage32Outer: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            tl.call(() => {
                charMove(naoto, "leapReady", 0, 0, false, 1)
            }, [], "+=0.5")
            tl.call(() => {
                charMove(naoto, "leap", 15, -25/scrnRatio, true)
            }, [], `+=${charMoveDuration(naoto, "leapReady", 0, 0, false, 1)}`)
            tl.call(() => {
                naoto.animPlaying = false
            }, [], `+=${charMoveDuration(naoto, "leap", 15, -25/scrnRatio, true)}`)
        }
    },
    stage32SubmarineInit: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            naoto.mesh.position.set(-2*unitToVw, 16*unitToVh,0)
            tl.call(() => {
                charMove(naoto, "drop", 1, -23.5/scrnRatio)
            }, [], "+=1.3")
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
                emit("naotoPosUpdate", 2) // submarine naoto landed
            }, [], `+=${charMoveDuration(naoto, "drop", 1, -23.5/scrnRatio)}`)
        }
    },
    stage33Init: ()=>{
        if (!naoto.animPlaying){
            
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            tl.call(() => {
                charMove(naoto, "run", 30, 0)
            }, [], "+=0")
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
                naoto.reactiveRig = true
                naoto.animPlaying = false
                emit("naotoPosUpdate", 1)
            }, [], `+=${charMoveDuration(naoto, "run", 30, 0)}`)
        }
    },
    stage33Yes: ()=>{
        props.animSequenceProp = null
        charMove(naoto, "yes", 0, 0)
        naoto.reactiveRig = false
    },
    stage33No: ()=>{
        props.animSequenceProp = null
        charMove(naoto, "no", 0, 0)
        naoto.reactiveRig = false
    },
    stage33Idle: ()=>{
        props.animSequenceProp = null
        charMove(naoto, "idle", 0, 0)
        naoto.reactiveRig = true
    },
    stage33Attacked: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true    
            props.animSequenceProp = null
            tl.call(() => {
                charMove(naoto, "idle", 0, 0)
                naoto.reactiveRig = false
            }, [], "+=0.5")
            tl.call(() => {
                charMove(naoto, "fear", 0, 0)
            }, [], `+=4.5`)
            tl.call(() => {
                charMove(naoto, "stabbed", -20, 0)
            }, [], `+=5.2`)
            tl.call(() => {
                emit("naotoPosUpdate", 4)
                naoto.animPlaying = false
            }, [], `+=${charMoveDuration(naoto, "stabbed", -20, 0)}`)
        }
    },
    stage33StabbedInSubmarine: ()=>{
        if (!naoto.animPlaying){
            let tl = gsap.timeline()
            naoto.animPlaying = true
            props.animSequenceProp = null
            naoto.mesh.position.set(12.5*unitToVw, -7.5*unitToVh,0)
            charMove(naoto, "stabbed", -20, 0)
            tl.call(() => {
                naoto.animPlaying = false
            }, [], `+=${charMoveDuration(naoto, "stabbed", -20, 0)}`)
        }
    },
    stage7: ()=>{
        if (!naoto.animPlaying){
            naoto.animPlaying = true
            props.animSequenceProp = null
            let tl = gsap.timeline()
            tl.call(() => {
                charMove(naoto, "stage7", 0, 0, false, 0)
                charMove(cookie, "stage7", 0, 0, false, 0)
                gsap.to(backLightFront.position, {
                    duration: 6,
                    y: 30,
                    z: 10,
                    ease: "power1.inOut",
                })
                gsap.to(backLightBack.position, {
                    duration: 6,
                    y: 20,
                    z: 10,
                    ease: "power1.inOut",
                })
                emit("naotoPosUpdate", 2)
            }, [], "+=0")
            tl.to(cam.position, {
                duration: 5,
                x: 0,
                y: -20-(2.09-window.innerWidth/window.innerHeight)*20,
                z: 20,
                ease: "power2.inOut",
            }, "+=2")
            tl.to(cam, {
                duration: 5,
                fov: 100,
                ease: "power2.in",
                onUpdate: () => cam.updateProjectionMatrix(),
            }, "<")
            tl.call(() => {
                emit("naotoPosUpdate", 3)
            }, [], `+=3.3`)
        }
    }
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
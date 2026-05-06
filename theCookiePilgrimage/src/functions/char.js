import * as THREE from "three"
import gsap from "gsap"
import MotionPathPlugin from "gsap/MotionPathPlugin"
gsap.registerPlugin(MotionPathPlugin)
import CustomEase from "gsap/CustomEase"
gsap.registerPlugin(CustomEase)

export function loadCharAnim(charname, animName, charObj, modelLoader){
    modelLoader.load(`${import.meta.env.BASE_URL}assets/char/${charname}_anim_${animName}.fbx`, (loaded) => {
        charObj.animClips[animName] = loaded.animations[0]
        for (const track of charObj.animClips[animName].tracks) { // removes interpolation for 8fps anim
            track.setInterpolation(THREE.InterpolateDiscrete)
        }
    })
}
export function loadCharSkm(charname, charObj, modelLoader){
    modelLoader.load(`${import.meta.env.BASE_URL}assets/char/${charname}_skm.fbx`, (loaded) => {
        charObj.mesh = loaded
        loaded.children.forEach(child=>{
            if(child.isSkinnedMesh){
                charObj.skm=child
            }
        }) 
        charObj.skeleton=charObj.skm.skeleton
    })
}

export function animTransition(charObj, newAnimName, duration=2){
    let currentAnim = charObj.animActions[charObj.currentAnim]
    let newAnim = charObj.animActions[newAnimName]
    newAnim.reset()
    newAnim.play()
    currentAnim.crossFadeTo(newAnim, duration*0.125)
    setTimeout(() => {
        charObj.currentAnim = newAnimName
    }, duration*0.125*1000)
}

export function charMove(charObj, newAnimName, displacementX, displacementY, parabola=false, transitionFrame=2, ease="none"){
    const unitToVw = 50/8
    let speed
    switch (newAnimName){
        case "run":
            speed = 24
            break
        case "walk":
            speed = 2.3
            break
        case "push":
            speed = 2.3
            break
        case "stabbed":
            speed = 40
            break
        default:
            break
    }
    
    let realDisplacementX = displacementX*unitToVw
    let realDisplacementY = displacementY*unitToVw
    let duration = Math.abs(displacementX)/speed
    let realEase = ease
    switch (newAnimName){
        case "leap":
            duration = 11*0.125
            realEase = CustomEase.create("custom", "M0,0 C0.078,0.209 0.198,0.366 0.444,0.471 0.645,0.556 0.763,0.778 0.813,0.934 0.835,1.003 0.829,1 1,1 ")
            break
        case "drop":
            duration = 10*0.125
            realEase = CustomEase.create("custom", "M0,0 C0.401,0.134 0.677,0.66 0.733,0.951 0.745,1.014 0.811,1.01 1,1 ")
            break
        case "point":
            duration = 14*0.125
            break
        case "turn":
            duration = 8*0.125
            break
        case "leapReady":
            duration = 3*0.125
            break
        default:
            break
    }
    let realHighPointX
    let realHighPointY
    if (parabola){
        if (displacementY > 0){
            realHighPointY = (displacementY+3)*unitToVw
        } else {
            realHighPointY = 3*unitToVw
        }
        realHighPointX = (displacementX/2+Math.atan(displacementY)/(Math.PI/4))*unitToVw
        gsap.to(charObj.mesh.position, {
            duration: duration,
            motionPath: {
                path: [
                    {x: realHighPointX, y: realHighPointY},
                    {x: realDisplacementX-realHighPointX, y: realDisplacementY-realHighPointY}
                ],
                type: "thru",
                relative: true,
                fromCurrent: true
            },
            ease: realEase
        })
    } else if (newAnimName === "turn"){
        gsap.to(charObj.mesh.rotation, {
            y: `+=${Math.PI}`,
            duration: duration,
            ease: realEase
        })
    } else {
        gsap.to(charObj.mesh.position, {
            x: `+=${realDisplacementX}`,
            y: `+=${realDisplacementY}`,
            duration: duration,
            ease: realEase
        })
    }
    animTransition(charObj, newAnimName, transitionFrame)
}

export function charMoveDuration(charObj, newAnimName, displacementX, displacementY, parabola=false, transitionFrame=2){
    let speed
    switch (newAnimName){
        case "run":
            speed = 24
            break
        case "walk":
            speed = 2.3
            break
        case "push":
            speed = 2.3
            break
        case "stabbed":
            speed = 40
            break
        default:
            break
    }
    let duration = Math.abs(displacementX)/speed
    switch (newAnimName){
        case "leap":
            duration = 11*0.125
            break
        case "drop":
            duration = 10*0.125
            break
        case "point":
            duration = 14*0.125
            break
        case "turn":
            duration = 8*0.125
            break
        case "idea":
            duration = 32*0.125
            break
        case "leapReady":
            duration = 3*0.125
            break
        case "stage33":
            if (charObj.name === "Nekomimi"){
                duration = 96*0.125
            }
            break
        case "stage51Init":
            duration = 51*0.125
            break
        case "parried":
            duration = 7*0.125
            break
        default:
            break
    }
    return duration
}

//get the index of the bone in the bones array by name, useful in the ik creation
export function getBoneIndex(skeleton,name){
    let output
    skeleton.bones.forEach((bone,i) => {
        if (bone.name === name){
            output = i
        }
    });
    return output
}

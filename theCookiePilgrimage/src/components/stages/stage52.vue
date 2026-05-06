<script setup>
import {ref, onMounted, useTemplateRef, reactive, watch} from "vue"
import {useRouter} from "vue-router"
import { popupNewInstance, popupFixSize, popupFixPosition, popupSnapCheck, popupCloseCheck, bridgeCheck } from "../../functions/popup"
import gsap from "gsap"

let router = useRouter()
const browserTopHeight = window.outerHeight - window.innerHeight + window.screenY
let scrn = {x: screen.availWidth, y:screen.availHeight}
let availableBridges = reactive({value: 2})
const hpBarDom = useTemplateRef("hpBarDom")
const bridges = {
    dummy: {
        dom: useTemplateRef("bridgesDummyDom"),
        highlight: false,
        occupied: false,
        xPos: window.innerWidth*32.5/100,
        yPos: window.innerHeight*48/100+browserTopHeight
    },
}
let popups = []
let popupID = {value: 0}
let chan

//level related
let hp = ref(5)
let popupWidth = 15*window.innerWidth/100

onMounted(() => {
    for (let i=0;i<popups.length;i++){
        popups[i].window.close()
    }

    chan = new BroadcastChannel("global")
    chan.onmessage=(e)=>{ //snap popup on message
        if (e.data.type==="snapButtonAction"){
            let popup
            popups.forEach(elem=>{
                if (elem.id===e.data.id){
                    popup = elem
                }
            })
            bridges[popup.occupyingBridge].occupied = true
            popup.locked = true
        }
        if (e.data.type==="handshake"&&e.data.id===0){
            chan.postMessage({type:"typeInitialize",id:e.data.id,popupType:4})
        }
        if (e.data.type==="handshake"&&e.data.id>0){
            chan.postMessage({type:"typeInitialize",id:e.data.id,popupType:5})
        }
        if (e.data.type==="handshake"&&e.data.id>0&&hp.value===0){
            chan.postMessage({type:"typeInitialize",id:e.data.id,popupType:6})
        }
        if (e.data.type==="goToArtifactChamber"){
            popups[0].window.close()
            router.push("/artifactChamber")
        }
    }


    let tl = gsap.timeline()
    tl.call(() => {
        popupNewInstance(popupID,popups,200,200,15,popupTick,availableBridges,chan)
        gsap.to(hpBarDom.value, {
            width: "80vw",
            duration: 2,
            ease: "none",
        })
    }, [])
    tl.call(() => {
        spawnNewPopup()
    }, [], "+=2")
})


function popupTick(){
    if (popups.length<1){
        cancelAnimationFrame(popupTick)
    }


    //iterate for all opened popups
    popups.forEach((elem,i)=>{ 
        if (document.hasFocus()){
            elem.window.focus()
        }
        popupFixSize(elem.window,15,15)
        if (elem.locked){
            popupFixPosition(elem.window,elem.lockedPositionX,elem.lockedPositionY)
        }

    })

    if (hp.value>0&&popups.length===2){
        colliderTick()
    }

    if (hp.value===0&&popups.length===2){
        colliderUpdate()
    }

    requestAnimationFrame(popupTick)
}

function spawnNewPopup(){
    let y = window.screenY+Math.random()*scrn.y-15*window.innerHeight/100
    popupNewInstance(popupID,popups,window.screenX+80*window.innerWidth/100,y,15,popupTick,availableBridges,chan)
    colliderInitialize()
}

function spawnFinalPopup(){
    popupNewInstance(popupID,popups,window.screenX+80*window.innerWidth/100,window.screenY+80*scrn.y/100,15,popupTick,availableBridges,chan)
    popups[1].window.vx = -5
    popups[1].window.vy = 0
}

function colliderInitialize(){
    popups[0].window.xp = popups[0].window.screenX
    popups[0].window.yp = popups[0].window.screenY
    popups[1].window.vx = -Math.random()*6-9
    popups[1].window.vy = Math.random()>0.5?-Math.random()*2-9:Math.random()*2+9
}

function colliderTick(){
    colliderGetCurrentVelocity()
    collisionInter()
    collisionEdge()
    if (popups.length===2){
        colliderUpdate()
    }
}

function collisionInter(){
    if (Math.abs(popups[1].window.screenX-popups[0].window.screenX)<popupWidth&&Math.abs(popups[1].window.screenY-popups[0].window.screenY)<popupWidth){ //detect for collision with driver popup
        
        if (Math.abs(popups[1].window.screenX-popups[0].window.screenX)>Math.abs(popups[1].window.screenY-popups[0].window.screenY)){ //detect x or y collision, > meaning x
            if (popups[1].window.screenX>popups[0].window.screenX){ // p4 to the right of p3
                popups[1].window.moveBy(popupWidth/8,0)
                if (popups[1].window.vx<0){
                    popups[1].window.vx*=-1
                }
            } else if (popups[1].window.screenX<popups[0].window.screenX){ // p4 to the left of p3
                popups[1].window.moveBy(-popupWidth/8,0)
                if (popups[1].window.vx>0){
                    popups[1].window.vx*=-1
                }
                popups[1].window.vx*=-1
            }   
        } else {
            if (popups[1].window.screenY>popups[0].window.screenY){ // p4 to the bottom of p3
                popups[1].window.moveBy(0,popupWidth/8)
                if (popups[1].window.vy<0){
                    popups[1].window.vy*=-1
                }
            } else if (popups[1].window.screenY<popups[0].window.screenY){ // p4 to the top of p3
                popups[1].window.moveBy(0,-popupWidth/8)
                if (popups[1].window.vy>0){
                    popups[1].window.vy*=-1
                }
            }
        }
         
        popups[1].window.vx += popups[0].window.vx
        popups[1].window.vy += popups[0].window.vy
    }
}

function collisionEdge(){
    if (popups[1].window.screenX<5||popups[1].window.screenX+popupWidth>scrn.x-15){
        if (hp.value>0){
            if (popups[1].window.screenX+popupWidth>scrn.x-15){
                hpBarUpdate()
            }
            popups[1].window.close()
            popups.splice(1,1)
            availableBridges.value += 1
            if (hp.value>0){
                gsap.delayedCall(0.5,()=>{  
                    spawnNewPopup()
                })
            }
        }
        if (hp.value===0){
            let tl = gsap.timeline()
            tl.call(() => {
                spawnFinalPopup()
            }, [], "+=2")
            tl.call(() => {
                popups[0].window.close()
                popups.splice(0,1)
                availableBridges.value += 1
            }, [], "+=0.5")
        }
    } else if (popups[1].window.screenY<window.screenY+10||popups[1].window.screenY+popupWidth>scrn.y-15){
        popups[1].window.vy*=-1
    }
}

function colliderUpdate(){
    if (Math.abs(popups[1].window.vx)>20){  // speed limit
        popups[1].window.vx=Math.abs(popups[1].window.vx)/popups[1].window.vx*20
    }
    if (Math.abs(popups[1].window.vy)>20){
        popups[1].window.vy=Math.abs(popups[1].window.vy)/popups[1].window.vy*20
    }
    popups[1].window.moveBy(popups[1].window.vx,popups[1].window.vy)
    popups[1].window.vx*=0.99 // speed damping
    popups[1].window.vy*=0.99
}

function colliderGetCurrentVelocity(){
    popups[0].window.vx = popups[0].window.screenX - popups[0].window.xp
    popups[0].window.vy = popups[0].window.screenY - popups[0].window.yp
    popups[0].window.xp = popups[0].window.screenX
    popups[0].window.yp = popups[0].window.screenY
}

function hpBarUpdate(){
    if (hp.value > 0){
        gsap.to(hpBarDom.value, {
            width: "-=16vw",
            duration: 0.3,
            ease: "none",
        })
        hp.value -= 1
        if (hp.value <= 0){
            console.log("won")
        }
    }
}

</script>

<template>
    <div id="body">
        <div id="hpBar" ref="hpBarDom"></div>
    </div>
</template>



<style scoped>
#body {
    position: relative;
}

#popupButton{
    position: fixed;
    left: 5vw;
    top: 20vh;
}

#hpBar{
    position: fixed;
    width: 0vw;
    height: 1vw;
    bottom: 6vw;
    left: 10vw;
    background-color: #600303;
    z-index: 4;
}

</style>
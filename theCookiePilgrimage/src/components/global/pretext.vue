<script setup>
import { ref, computed, reactive, watch } from 'vue'
import {
  prepareWithSegments,
  layoutNextLineRange,
  materializeLineRange
} from '@chenglou/pretext'
import * as THREE from "three"

let scrnRatio = window.innerWidth/window.innerHeight
let vhToPx = window.innerHeight/100
let vwToPx = window.innerWidth/100

// pretext related
let water = "water"
let textSource = ref(water.repeat(3500))
let lineHeight = 0.6*vwToPx
let preparedSource = prepareWithSegments(textSource.value, `${0.8*vwToPx}px Arial`, {whiteSpace: 'pre-wrap'})
let divider = reactive({
    a: 4, // amplitude, in vh
    omega: 0.006, // angular frequency
    phi: -50, // phase, in vw
    b: 40, // in vh, top to bottom
})
let popupObstacle = reactive({
    x: 0*vwToPx, // in vw
    y: 0*vhToPx, // in vh
    width: 0, // in vw
    height: 0, // in vw
    padding: 1*vwToPx, // in vw
})

const clock = new THREE.Timer()
const props = defineProps(["popupObstacle"])
watch(props.popupObstacle, (e) => {
    popupObstacle.x = e.x
    popupObstacle.y = e.y
    popupObstacle.width = e.width
    popupObstacle.height = e.height
})

const lines = computed(() => { // create an array of lines/intervals for v-for to render
    const output = []
    let cursor = {
        segmentIndex: 0,
        graphemeIndex: 0
    }
    let y = 0 // in px
    
    while (true) {
        let lineTop = y
        let lineBottom = y + lineHeight
        let intervals = [{
            x: 0,
            availableWidth: window.innerWidth,
            index: 0
        }]
        let stop = false

        let range = null

        let obstacleCheck = lineTop>popupObstacle.y-popupObstacle.padding&&lineBottom<popupObstacle.y+popupObstacle.height+popupObstacle.padding
        let wavesCheck = lineTop>Math.min(divider.b*vhToPx-divider.a*vhToPx,divider.b*vhToPx+divider.a*vhToPx)&&lineTop<Math.max(divider.b*vhToPx-divider.a*vhToPx,divider.b*vhToPx+divider.a*vhToPx)
        if (wavesCheck||obstacleCheck){
            intervals = getIntervals(lineTop,wavesCheck,obstacleCheck)
        }

        if (lineTop>divider.b*vhToPx-Math.abs(divider.a*vhToPx)){  // for all lines under air, or all existing lines
            for (let interval of intervals){
                range = layoutNextLineRange(preparedSource, cursor, interval.availableWidth)

                if (range === null) {
                    stop = true
                    break
                }
                const line = materializeLineRange(preparedSource, range)
                output.push({
                    text: line.text,
                    x: interval.x,
                    y,
                    width: line.width,
                    availableWidth: interval.availableWidth,
                    key: String(Math.round(y))+String(interval.index) // create a unique key for each interval, or line
                })
                cursor = range.end
            }
            
        }
        if (stop){
            break
        }

        y += lineHeight
    }

    return output
})

function getIntervals(y,wavesCheck,obstacleCheck){
    let waveIntervals = []
    let noneWaveIntervals = []

    let baseX = 0
    let availableWidth = 0
    
    if (wavesCheck){
        // calculating base x coord for the waves, based on the y coord and the wave function, including positive and negative amplitudes
        if (divider.a>0){
            baseX = Math.acos((y-divider.b*vhToPx)/(Math.abs(divider.a*vhToPx)))/divider.omega
            availableWidth = Math.PI*2/divider.omega-baseX*2
        } else {
            baseX = Math.acos((y-divider.b*vhToPx)/(Math.abs(divider.a*vhToPx)))/divider.omega-Math.PI/divider.omega
            availableWidth = Math.abs(baseX)*2
        }
        
        // dividing intervals for the waves
        for (let i=0;i<5;i++){
            let newXStart = baseX + Math.PI*2/divider.omega*i + divider.phi*vwToPx // base x coord + phase change
            let newXEnd = newXStart + availableWidth
            if (newXStart<0 && newXEnd<window.innerWidth){
                waveIntervals.push({
                    x: 0,
                    availableWidth: newXEnd
                })
            } else if (newXStart>0 && newXEnd<window.innerWidth){
                waveIntervals.push({
                    x: newXStart,
                    availableWidth
                })
            } else if (newXStart>0 && newXEnd>window.innerWidth){
                waveIntervals.push({
                    x: newXStart,
                    availableWidth: window.innerWidth-newXStart
                })
            }
            
        }
    } else {
        noneWaveIntervals.push({
            x: 0,
            availableWidth: popupObstacle.x-popupObstacle.padding
        })
        noneWaveIntervals.push({
            x: popupObstacle.x+popupObstacle.width+popupObstacle.padding,
            availableWidth: window.innerWidth-popupObstacle.x-popupObstacle.width-popupObstacle.padding
        })
    }
    
    

    //secondary check including the popup obstacle
    if (obstacleCheck){
        let indexToSplice = []
        for (let item of waveIntervals){
            if (item.x>popupObstacle.x-popupObstacle.padding&&item.x+item.availableWidth<popupObstacle.x+popupObstacle.width+popupObstacle.padding){ // when line is completely inside obstacle
                indexToSplice.push(waveIntervals.indexOf(item))
            } else if (item.x<popupObstacle.x-popupObstacle.padding&&item.x+item.availableWidth>popupObstacle.x+popupObstacle.width+popupObstacle.padding){ // when obstacle is completely inside line
                let newXStart = item.x
                let availableWidth = item.availableWidth
                indexToSplice.push(waveIntervals.indexOf(item))
                waveIntervals.push({
                    x: newXStart,
                    availableWidth: popupObstacle.x-popupObstacle.padding-item.x
                })
                waveIntervals.push({
                    x: popupObstacle.x+popupObstacle.width+popupObstacle.padding,
                    availableWidth: newXStart+availableWidth-(popupObstacle.x+popupObstacle.width+popupObstacle.padding)
                })
            } else if (item.x>popupObstacle.x-popupObstacle.padding&&item.x<popupObstacle.x+popupObstacle.width+popupObstacle.padding){ // when only start of line is inside obstacle
                item.x = popupObstacle.x+popupObstacle.width+popupObstacle.padding
            } else if (item.x+item.availableWidth>popupObstacle.x-popupObstacle.padding&&item.x+item.availableWidth<popupObstacle.x+popupObstacle.width+popupObstacle.padding){ // when only end of line is inside obstacle
                item.availableWidth = popupObstacle.x-popupObstacle.padding-item.x
            }
        }
        for (let index of indexToSplice){
            waveIntervals.splice(index,1) // splice after the for loop to avoid index shifting
        }
    }
    let output = waveIntervals.concat(noneWaveIntervals)

    // removing intervals that are too small
    for (let item of output){
        if (item.availableWidth<10){
            output.splice(output.indexOf(item),1)
        }
    }

    // assign index to each interval
    for (let item of output){
        item.index = output.indexOf(item)
    }

    return output
}

function tick(){
    clock.update()
    let elapsedTime = clock.getElapsed()

    divider.phi = Math.sin(elapsedTime/4)*10-50
    divider.b = Math.sin(elapsedTime/2)*2+30
    divider.a = Math.sin(elapsedTime*2)*2
    requestAnimationFrame(tick)
}
tick()

</script>
<template>
    <div id="body">
        <div v-for="line in lines" class="lines" :key="line.key" :style="{
            transform: `translate(${line.x}px, ${line.y}px)`,
            width: line.availableWidth + 'px',
            height: lineHeight + 'px',
            lineHeight: lineHeight + 'px',
        }">
            {{ line.text }}
        </div>
    </div>
</template>
<style scoped>

.lines{
    position: absolute;
    left: 0;
    top: 0;
    box-sizing: border-box;
    overflow: hidden;
    padding: 0;
    font-size: 0.8vw;
    color:rgb(156, 211, 211)
}
</style>
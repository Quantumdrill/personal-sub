import * as THREE from "three"
import { CCDIKSolver } from "three/examples/jsm/Addons.js"

//get the index of the bone in the bones array by name, useful in the ik creation
//required for create3JointIK function
export function getBoneIndex(skeleton,name){
    let output
    skeleton.bones.forEach((bone,i) => {
        if (bone.name === name){
            output = i
        }
    });
    return output
}

//create ik system
export function create3JointIK(skinnedMesh,skeleton,[target,effector,midJoint,topJoint]){
    const iks = [{
        target: getBoneIndex(skeleton,target),
        effector: getBoneIndex(skeleton,effector),
        links: [
            {index: getBoneIndex(skeleton,midJoint)},
            {index: getBoneIndex(skeleton,topJoint)}
        ],
        iteration: 10,
    }]
    return new CCDIKSolver(skinnedMesh,iks)
}

//world orientation to local, aka orient constraint
export function orientConstraint(driver,child,parent){ 
    let driver_WR
    if (driver.isQuaternion || driver.isEuler){ // depends on if the upv is a vector or an object
        if (driver.isEuler){
            driver = new THREE.Quaternion().setFromEuler(driver)
        }
        driver_WR = driver
    } else {
        driver_WR = driver.getWorldQuaternion(new THREE.Quaternion())
    }
    const parent_WR = parent.getWorldQuaternion(new THREE.Quaternion())
    child.quaternion.copy(driver_WR).premultiply(new THREE.Quaternion().copy(parent_WR).invert())
    child.updateMatrix()
}

//world position to local, aka point constraint
export function pointConstraint(world,child,parent){ 
    let worldPos
    if (world.isVector3){ // depends on if the upv is a vector or an object
        worldPos = world
    } else {
        worldPos = world.getWorldPosition(new THREE.Vector3())
    }
    const parentWMatrix = parent.matrixWorld
    const parentiWMatrix = new THREE.Matrix4().copy(parentWMatrix).invert()
    const localPos = new THREE.Vector3().copy(worldPos).applyMatrix4(parentiWMatrix)
    child.position.copy(localPos)
}

//let object aim at a direction with keeping a certain roll angle
export function aimConstraint(obj,target,upv,parent=new THREE.Vector3(0,0,0),targetIsLocal=true,frontAxis=new THREE.Vector3(0,0,1),upAxis=new THREE.Vector3(0,1,0)){
    // the targetV .makeBasis() takes in is a local vector
    // the frontAxis & upAxis is used to determine which direction of the object itself is considered the front and the side, default is z front, y up, just like how threejs defines
    let upV = upv
    let targetV
    let frontA = frontAxis
    let upA = upAxis
    if (target.isVector3){ // depends on if the target is a vector or an object
        targetV = target
        if (!targetIsLocal){ // turns targetV a local vector if not
            targetV.sub(obj.getWorldPosition(new THREE.Vector3)) 
        }
    } else {
        targetV = target.getWorldPosition(new THREE.Vector3)
        targetV.sub(obj.getWorldPosition(new THREE.Vector3)) 
    }
    upV.normalize()
    targetV.normalize()
    let sideV = new THREE.Vector3().crossVectors(upV,targetV).normalize()
    let upVOrtho = new THREE.Vector3().crossVectors(targetV,sideV).normalize() // orthogonal upV adjusted based on upV and targetV, if upV is not orthogonal to targetV.
    frontA.normalize()
    upA.normalize()
    let sideA = new THREE.Vector3().crossVectors(upA,frontA).normalize()
    //axis offset is the offset from the desired front & up basic to the default basic of z front and y up
    let axisOffset = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(sideA,upA,frontA)).invert()
    let aimQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(sideV,upVOrtho,targetV)).multiply(axisOffset)
    orientConstraint(aimQuat,obj,parent)
}

export function poleVectorConstraint(ik,eff,elbow,shoulder,pv,parent){
    let effPos = eff.getWorldPosition(new THREE.Vector3())
    let elbowPos = elbow.getWorldPosition(new THREE.Vector3())
    let shoulderPos = shoulder.getWorldPosition(new THREE.Vector3())
    let pvPos = pv.getWorldPosition(new THREE.Vector3())
    let ikPos = ik.getWorldPosition(new THREE.Vector3())

    let shoulderToPV = new THREE.Vector3().subVectors(pvPos,shoulderPos)
    let shoulderToIK = new THREE.Vector3().subVectors(ikPos,shoulderPos)

    let angle = new THREE.Vector3().copy(new THREE.Vector3().subVectors(effPos,shoulderPos)).angleTo(new THREE.Vector3().subVectors(elbowPos,shoulderPos)) 
    let normal = new THREE.Vector3().crossVectors(shoulderToIK,shoulderToPV).normalize()
    let shoulderAimVector = new THREE.Vector3().copy(shoulderToIK).multiplyScalar(Math.cos(angle)).add(new THREE.Vector3().crossVectors(normal,shoulderToIK).multiplyScalar(Math.sin(angle))) //Rodrigues formula
    let upv = new THREE.Vector3().crossVectors(shoulderAimVector,normal)
    aimConstraint(shoulder,shoulderAimVector,upv,parent,true,new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,-1))
}
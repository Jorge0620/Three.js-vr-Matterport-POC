import * as THREE from 'three'
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { PANOS } from './data'
import { Quaternion, Vector3 } from 'three';
import { threadId } from 'worker_threads';

//----------------------------
// initialize values
//----------------------------

let pano = PANOS.find((p) => p.id === 'mg9u8xta4qznkr54qyi4r56gb')
let quat = new THREE.Quaternion(pano.rotation.x, pano.rotation.y, pano.rotation.z, pano.rotation.w)
let euler = new THREE.Euler().setFromQuaternion(quat)
let ey = euler.y
let ez = euler.z
euler.y = ez
euler.z = -ey
quat = new THREE.Quaternion().setFromEuler(euler)
let addQuat = new THREE.Quaternion();

const points: Vector3[] = []

const line = new MeshLine();
const material = new MeshLineMaterial({lineWidth: 0.03, color: new THREE.Color(0xff0000 )});
const mesh = new THREE.Mesh(line, material);


//------------------------------------------------------------------
// Create camera.
//------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 30000)
// const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 0.1, 30000 );

camera.up.set(0, 1, 0) // Set Y axis to be up.

//------------------------------------------------------------------
// mouse move.
//------------------------------------------------------------------

const raycaster = new THREE.Raycaster()
raycaster.layers.set( 1 );
const pointer = new THREE.Vector2();
var vec = new THREE.Vector3(); // create once and reuse
let cubePosition = new Vector3();

document.addEventListener('mousemove', onMouseMove, false)
let baseEular = new THREE.Euler(pano.corRotation.x, pano.corRotation.y, pano.corRotation.z)
function onMouseMove(event:MouseEvent)
{
  vec.set(
      ( event.clientX / window.innerWidth ) * 2 - 1,
      - ( event.clientY / window.innerHeight ) * 2 + 1,
      0.5 );
  vec.unproject( camera );
  vec.sub( camera.position ).normalize();

  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  cube.getWorldPosition(cubePosition)
  raycaster.set(cubePosition, vec)

  const intersects = raycaster.intersectObjects( scene.children );
  points.length = 0
  points.push(cubePosition);
  if(intersects.length > 0) {
    points.push(new Vector3(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  line.setPoints(points);
  line.setGeometry(geometry);
}

const renderer = new THREE.WebGLRenderer()
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputEncoding = THREE.sRGBEncoding
document.body.appendChild(renderer.domElement)

//------------------------------------------------------------------
// Setup basic scene.
//------------------------------------------------------------------

const scene = new THREE.Scene()
const stats = Stats()
document.body.appendChild(stats.dom)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target = new THREE.Vector3(pano.position.x, pano.position.z, -pano.position.y)

var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff)
hemiLight.position.set(0, 0, 0)
scene.add(hemiLight)

let images = [
  `data/images/${pano.id}_2.jpg`,
  `data/images/${pano.id}_4.jpg`,
  `data/images/${pano.id}_0.jpg`,
  `data/images/${pano.id}_5.jpg`,
  `data/images/${pano.id}_1.jpg`,
  `data/images/${pano.id}_3.jpg`,
]
scene.background = new THREE.CubeTextureLoader().load(images)

//------------------------------------------------------------------
// Add the first panos "cube" in its model position.
//------------------------------------------------------------------
// Note: These textures don't align properly.
// As far as I can tell, texture_1 is in the direction rotation.
const cubeTextureLoader = new THREE.TextureLoader()
let textures = images.map((i) => cubeTextureLoader.load(i))
let cubeMaterial = textures.map((t, i) => {
  const mb = new THREE.MeshBasicMaterial({ map: t, side: THREE.FrontSide, opacity: 0.5, transparent: true })
  return mb
})
const cube = new THREE.Mesh(new THREE.BoxGeometry(-1, 1, 1), cubeMaterial)
cube.position.set(pano.position.x, pano.position.z, -pano.position.y)

//------------------------------------------------------------------
// Load the OBJ model.
//------------------------------------------------------------------

const loader = new OBJLoader()
var mtlLoader = new MTLLoader()
var url = 'data/model/443e1f33cea74d1a9d317bd4e10eb1e0.mtl'
let houseModel = new THREE.Group();
mtlLoader.load(url, function (materials: any) {
  loader.setMaterials(materials)
  loader.load('data/model/443e1f33cea74d1a9d317bd4e10eb1e0.obj', function (object) {
    object.traverse(function (node: any) {
      node.layers.enable( 1 );
      if ((node as THREE.Mesh).geometry) {
        const mat = (node as THREE.Mesh).material as THREE.MeshPhongMaterial
        mat.transparent = true
        mat.opacity = 1
        mat.side = THREE.DoubleSide
        const vertices = ((node as THREE.Mesh).geometry.attributes.position as any).array

        // Reorient (x, y, z) = ( x, z, -y )
        for (let i = 0; i < vertices.length; i = i + 3) {
          const x = vertices[i]
          const y = vertices[i + 1]
          const z = vertices[i + 2]
          vertices[i] = x
          vertices[i + 1] = z
          vertices[i + 2] = -y
          
        }
      }
    })
    object.rotation.set(0, 0, 0)
    houseModel = object
    houseModel.add(cube)
    scene.add(houseModel)
    baseEular = new THREE.Euler(pano.corRotation.x, pano.corRotation.y, pano.corRotation.z)
    addQuat.setFromEuler(baseEular)
    houseModel.setRotationFromQuaternion(addQuat.invert())
    let cubePosition = new Vector3();
    cube.getWorldPosition(cubePosition)
    controls.target = cubePosition
    camera.position.set(cubePosition.x + 1, cubePosition.y + 1, cubePosition.z + 1)
  })
})


//------------------------------------------------------------------
// Load the first pano as the background.
//------------------------------------------------------------------

function changeId(_id: string) {
  console.log(_id)
  pano = PANOS.find((p) => p.id === _id)
  quat = new THREE.Quaternion(pano.rotation.x, pano.rotation.y, pano.rotation.z, pano.rotation.w)
  euler = new THREE.Euler().setFromQuaternion(quat)
  ey = euler.y
  ez = euler.z
  euler.y = ez
  euler.z = -ey
  quat = new THREE.Quaternion().setFromEuler(euler)
  baseEular = new THREE.Euler(pano.corRotation.x, pano.corRotation.y, pano.corRotation.z)
  addQuat.setFromEuler(baseEular)
  houseModel.setRotationFromQuaternion(addQuat.invert())
  cube.rotation.setFromVector3(new Vector3(pano.corRotation.x, pano.corRotation.y, pano.corRotation.z));
  cube.position.set(pano.position.x, pano.position.z, -pano.position.y)
  let cubePosition = new Vector3();
  cube.getWorldPosition(cubePosition)
  controls.target = cubePosition
  camera.position.set(cubePosition.x + 1, cubePosition.y + 1, cubePosition.z + 1)
  scene.updateMatrix()
  images = [
    `data/images/${pano.id}_2.jpg`,
    `data/images/${pano.id}_4.jpg`,
    `data/images/${pano.id}_0.jpg`,
    `data/images/${pano.id}_5.jpg`,
    `data/images/${pano.id}_1.jpg`,
    `data/images/${pano.id}_3.jpg`,
  ]
  textures = images.map((i) => cubeTextureLoader.load(i))
  cubeMaterial = textures.map((t, i) => {
    const mb = new THREE.MeshBasicMaterial({ map: t, side: THREE.FrontSide, opacity: 0.5, transparent: true })
    return mb
  })
  cube.material = cubeMaterial
  scene.background = new THREE.CubeTextureLoader().load(images)
}
window.changeId = changeId;

scene.add(mesh);

//------------------------------------------------------------------
// TODO
//------------------------------------------------------------------
// Map the position of the users cursor on the scene.background
// to a position on the OBJ model.

//------------------------------------------------------------------
// Rendering.
//------------------------------------------------------------------
function render() {
  controls.update()
  stats.update()
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

render()

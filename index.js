import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';


const hitSound = new Audio('sound/heartsteel_proc_sound.mp3');
const musiqueDeFond = new Audio('sound/monster_hunter_music.mp3');
hitSound.volume = 0.3;
musiqueDeFond.volume = 0.3; 

let gameStarted = false;
let minutes_restant = 10;
let secondes_restantes = "00";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);


//Skybox

let materialArray = [];
const loader = new THREE.TextureLoader();
let textureft = loader.load('texture/barren_ft.jpg');
let texturebk = loader.load('texture/barren_bk.jpg');
let texturelf = loader.load('texture/barren_dn.jpg');
let texturert = loader.load('texture/barren_lf.jpg');
let textureup = loader.load('texture/barren_rt.jpg');
let texturedn = loader.load('texture/barren_up.jpg');


materialArray.push(new THREE.MeshBasicMaterial({map : texturebk}));
materialArray.push(new THREE.MeshBasicMaterial({map : textureft}));
materialArray.push(new THREE.MeshBasicMaterial({map : texturedn}));
materialArray.push(new THREE.MeshBasicMaterial({map : texturelf}));
materialArray.push(new THREE.MeshBasicMaterial({map : texturert}));
materialArray.push(new THREE.MeshBasicMaterial({map : textureup}));

materialArray.forEach(material => {
    material.side = THREE.BackSide;
});

let skyboxGeo = new THREE.BoxGeometry(500,500,500);
let skybox = new THREE.Mesh(skyboxGeo, materialArray);
scene.add(skybox);

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
scene.add(ambientLight);





// "Fruit" array
let fruits = [];
let projectiles = [];
let particles = [];


//Score

let monster_score = 0


//Pause cube
const greenCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
greenCube.position.set(8, 3, -8);
scene.add(greenCube);


const redCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
redCube.position.set(8, 3, -8);



// Create cubes (fruits)
function createFruit() {
    if (gameStarted){
        let geometry;
        const shapeType = Math.floor(Math.random() * 4); // 0 = cube, 1 = rectangle, 2 = sphere, 3 = triangle

        switch (shapeType) {
            case 0: // Cube
                geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
                break;
            case 1: // Rectangle
                geometry = new THREE.BoxGeometry(0.6, 0.3, 0.2);
                break;
            case 2: // Sphère
                geometry = new THREE.SphereGeometry(0.3, 16, 16);
                break;
            case 3: // Triangle
                geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    0, 0.4, 0, 
                    -0.3, -0.2, 0, 
                    0.3, -0.2, 0  
                ]);
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                break;
        }

        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const fruit = new THREE.Mesh(geometry, material);
        fruit.position.set((Math.random() - 0.5) * 4, 2, (Math.random() - 0.5) * 4);
        scene.add(fruit);
        fruits.push(fruit);
    }
}


// Spawn fruits every second
setInterval(createFruit, 1000);
    
// Create projectiles (spheres)
function createProjectile(direction) {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.set(camera.position.x, camera.position.y, camera.position.z);  // Start position is the camera's position
    projectile.velocity = direction.multiplyScalar(0.1); // Set velocity in the direction of the raycast
    scene.add(projectile);
    projectile.velocity = direction.multiplyScalar(10); 

    projectiles.push(projectile);
}

// Raycaster for detecting intersection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const direction = raycaster.ray.direction.clone();
    createProjectile(direction);
});

// Create particles (mini cubes) for explosion effect
function createExplosionEffect(position) {
    const numParticles = 50;  
    for (let i = 0; i < numParticles; i++) {
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05); 
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);

        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3, 
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        particle.velocity = velocity;

       
        particle.rotationVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,  
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );

        scene.add(particle);
        particles.push(particle);

        //Delete particle after 500ms
        setTimeout(() => {
            scene.remove(particle);
            particles = particles.filter(p => p !== particle);
        }, 500);  
    }
}



function applyGravity() {
    if (gameStarted){
    fruits.forEach((fruit, index) => {
        fruit.position.y -= 0.02;  // "gravity"

        
        if (fruit.position.y <= floor.position.y + 0.2) { 
            scene.remove(fruit);
            fruits.splice(index, 1);
        }
    });}
}

let textMesh = null;
function setScore() {

    const loader = new FontLoader();
    const fontPath = 'helvetiker_regular.typeface.json'; 

    loader.load(fontPath, function (font) {


        const color = new THREE.Color(0x006699);


        const matLite = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });

        const message = 'Score:\n' + monster_score;

        const shapes = font.generateShapes(message, 10);

        const geometry = new THREE.ShapeGeometry(shapes);

        geometry.computeBoundingBox();

        const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

        geometry.translate(xMid, 1, 1);

        // make shape 

        textMesh = new THREE.Mesh(geometry, matLite);

        textMesh.position.z = - 150;
        textMesh.position.x = 15;
        textMesh.position.y = 15;
        scene.add(textMesh);
        

    }, undefined, function (error) {
        console.error(`Error loading font from: ${window.location.origin}/${fontPath}`, error);
    });
}

let chronoMesh = null;
function setChrono() {
    if (chronoMesh) {
        scene.remove(chronoMesh);
    }

    const loader = new FontLoader();
    const fontPath = 'helvetiker_regular.typeface.json'; 
    loader.load(fontPath, function (font) {
        const color = new THREE.Color(0x006699);
        const matLite = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });

        let message = 'Chrono:\n' + minutes_restant + ':' + secondes_restantes;
        if (minutes_restant === 0 && secondes_restantes === '00') {
            message = 'Merci pour cette Partie!';
            monster_score = 0;
            minutes_restant = 10;
            gameStarted = false;
            scene.remove(redCube);
            scene.add(greenCube);
            musiqueDeFond.pause();
            
            fruits.forEach(fruit => {
                scene.remove(fruit);
            });
            fruits = [];
        }

        const shapes = font.generateShapes(message, 10);
        const geometry = new THREE.ShapeGeometry(shapes);

        geometry.computeBoundingBox();
        const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        geometry.translate(xMid, 1, 1);

        chronoMesh = new THREE.Mesh(geometry, matLite);
        chronoMesh.position.set(15, 100, -150);
        scene.add(chronoMesh);

        
    }, undefined, function (error) {
        console.error(`Erreur de chargement de la police : ${fontPath}`, error);
    });
}


function modifyScore(){
    
    if (gameStarted){
        
        let valeur = parseInt(secondes_restantes, 10); 

    if (valeur === 0) {
        secondes_restantes = "59";
        minutes_restant--;
    } else {
        valeur--; 
        secondes_restantes = valeur.toString().padStart(2, '0'); 
    }

        
    setChrono();
        
    }
}



setInterval(modifyScore,1000)




async function checkCollisions() {
    for (let index = 0; index < projectiles.length; index++) {
        const projectile = projectiles[index];
        projectile.position.add(projectile.velocity);  // Move projectile

        raycaster.set(projectile.position, projectile.velocity);  // Cast ray from projectile's position

        const intersects = raycaster.intersectObjects(fruits);

        if (intersects.length > 0 && gameStarted) {
            const target = intersects[0].object;
            const position = target.position.clone();  // Get the position of the fruit

            hitSound.currentTime = 0;
            hitSound.play();
            createExplosionEffect(position);

            scene.remove(target);
            fruits = fruits.filter(fruit => fruit !== target);

            scene.remove(projectile);
            projectiles.splice(index, 1);

            monster_score += 100;

            if (textMesh) {
                scene.remove(textMesh);
            }
            setScore();
        }
        if (!gameStarted && raycaster.intersectObject(greenCube).length > 0) {
            gameStarted = true;
            scene.remove(greenCube);
            scene.add(redCube);
            musiqueDeFond.play();
            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        }
        if (gameStarted && raycaster.intersectObject(redCube).length > 0) {
            gameStarted = false;
            scene.remove(redCube);
            scene.add(greenCube);
            musiqueDeFond.pause();
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            return;
        }
    }
}



const floorGeometry = new THREE.PlaneGeometry(100, 100);

const floor = new THREE.Mesh(floorGeometry, textureup);
floor.rotation.x = - Math.PI / 2;  
floor.position.y = -3;  
scene.add(floor);

// Animation loop
function animate() {
    requestAnimationFrame(animate);



    applyGravity();
    checkCollisions();

   
    particles.forEach(particle => {
        particle.position.add(particle.velocity);  
        particle.rotation.x += particle.rotationVelocity.x; 
        particle.rotation.y += particle.rotationVelocity.y;  
        particle.rotation.z += particle.rotationVelocity.z;  
    });

    controls.update();
    renderer.render(scene, camera);
}


animate();

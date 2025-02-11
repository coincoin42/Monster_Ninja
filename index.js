import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';


const hitSound = new Audio('sound/heartsteel_proc_sound.mp3');
hitSound.volume = 0.5; // Ajuste le volume si nécessaire

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Lumière douce
scene.add(ambientLight);

// Charger les textures pour chaque face de la skybox
const textureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = textureLoader.load([
    'texture/posx.jpg', // droite
    'texture/posx.jpg', // gauche
    'texture/posy.jpg', // haut
    'texture/negy.jpg', // bas
    'texture/posz.jpg', // avant
    'texture/negz.jpg'  // arrière
]);

// Appliquer la texture à la scène (background)
scene.background = skyboxTexture;



// Fruit array
let fruits = [];
let projectiles = [];
let particles = [];


//Score

let monster_score = 0





// Create cubes (fruits)
function createFruit() {
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
                0, 0.4, 0,  // Sommet
                -0.3, -0.2, 0, // Bas gauche
                0.3, -0.2, 0  // Bas droit
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
    projectile.velocity = direction.multiplyScalar(10); // Vitesse beaucoup plus élevée

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
    const numParticles = 50;  // Augmenter le nombre de particules
    for (let i = 0; i < numParticles; i++) {
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05); // Petits cubes
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);

        // Direction aléatoire et vitesse plus élevée
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,  // Vitesse plus élevée
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        particle.velocity = velocity;

        // Rotation initiale
        particle.rotationVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,  // Rotation aléatoire
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );

        scene.add(particle);
        particles.push(particle);

        // Supprimer la particule après un certain temps
        setTimeout(() => {
            scene.remove(particle);
            particles = particles.filter(p => p !== particle);
        }, 500);  // La particule disparaît après 500ms
    }
}


function applyGravity() {
    fruits.forEach((fruit, index) => {
        fruit.position.y -= 0.02;  // Appliquer la gravité

        // Vérifier si le fruit touche le sol
        if (fruit.position.y <= floor.position.y + 0.2) {  // Légère marge pour éviter qu'ils passent à travers
            scene.remove(fruit);
            fruits.splice(index, 1);
        }
    });
}

let textMesh = null;
function setScore() {

    const loader = new FontLoader();
    const fontPath = 'helvetiker_regular.typeface.json'; // Adjust path if needed

    loader.load(fontPath, function (font) {


        const color = new THREE.Color(0x006699);

        const matDark = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide
        });

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

        // make shape ( N.B. edge view not visible )

        textMesh = new THREE.Mesh(geometry, matLite);

        textMesh.position.z = - 150;
        textMesh.position.x = 15;
        textMesh.position.y = 15;
        scene.add(textMesh);
        console.log("textmesh dans le set :" + textMesh)

    }, undefined, function (error) {
        console.error(`Error loading font from: ${window.location.origin}/${fontPath}`, error);
    });
}



function checkCollisions() {
    projectiles.forEach((projectile, index) => {
        projectile.position.add(projectile.velocity);  // Move projectile

        raycaster.set(projectile.position, projectile.velocity);  // Cast ray from projectile's position

        const intersects = raycaster.intersectObjects(fruits);

        if (intersects.length > 0) {
            // Remove the fruit and create explosion effect
            const target = intersects[0].object;
            const position = target.position.clone();  // Get the position of the fruit

            hitSound.currentTime = 0; // Remet le son au début
            hitSound.play();
            // Create explosion particles
            createExplosionEffect(position);

            // Remove the fruit
            scene.remove(target);
            fruits = fruits.filter(fruit => fruit !== target);

            // Remove the projectile
            scene.remove(projectile);
            projectiles.splice(index, 1);

            //update score
            monster_score += 100;


            if (textMesh) {
                console.log("textmesh n'est pas nulle")
                scene.remove(textMesh);
            }
            setScore();
        }
    });
}


// Ajouter un sol
const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = - Math.PI / 2;  // Orienter le sol horizontalement
floor.position.y = -3;  // Placer le sol en dessous
scene.add(floor);

// Animation loop
function animate() {
    requestAnimationFrame(animate);



    applyGravity();
    checkCollisions();

    // Mise à jour de la position et de la rotation des particules
    particles.forEach(particle => {
        particle.position.add(particle.velocity);  // Déplacer la particule selon sa vélocité
        particle.rotation.x += particle.rotationVelocity.x;  // Rotation autour de l'axe X
        particle.rotation.y += particle.rotationVelocity.y;  // Rotation autour de l'axe Y
        particle.rotation.z += particle.rotationVelocity.z;  // Rotation autour de l'axe Z
    });

    controls.update();
    renderer.render(scene, camera);
}


animate();

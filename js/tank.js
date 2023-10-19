import * as BABYLON from 'babylonjs';
import { AdvancedDynamicTexture, Rectangle } from 'babylonjs-gui';

class Tank {
    constructor(name, startPosition, scene, shadowGenerator, isGunControlled = false, canvas = null) {
        this.name = name;
        this.startPosition = startPosition;
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        this.isGunControlled = isGunControlled;
        this.canvas = canvas;

        this.tankMaterial = new BABYLON.StandardMaterial("tankMaterial", this.scene);
        this.tankMaterial.diffuseTexture = new BABYLON.Texture("/tank.jpg");
        this.wheelMaterial = new BABYLON.StandardMaterial("wheelMaterial", this.scene);
        this.wheelMaterial.diffuseTexture = new BABYLON.Texture("/wheel.png");

        this.tankSpeed = 0.08;
        this.maxTankSpeed = 8;
        this.rotationSpeed = 0.02;
        this.maxRotationSpeed = 1;
        this.breakForce = 2;
        this.gunRotationSpeed = 0.01;
        this.steeringAngle = 0;
        this.maxSteeringAngle = Math.PI / 4;
        this.lastBulletTime = 0;
        this.shootGap = 100;


        this.tank = null;

        this.wheels = [];
        this.constraints = [];

        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.createTank();
    }

    createTank() {
        this.tank = BABYLON.MeshBuilder.CreateBox(this.name, { width: 3, height: 1, depth: 3 }, this.scene);
        this.tank.position = this.startPosition;
        this.tank.previousPosition = this.tank.position.clone();
        this.tank.material = this.tankMaterial;
        this.tank.direction = 1;
        this.tank.health = 100;
        this.shadowGenerator.addShadowCaster(this.tank);

        const leftSideStick = BABYLON.MeshBuilder.CreateBox("leftSideStick", { width: 0.2, height: 1, depth: 0.2 }, this.scene);
        leftSideStick.position = new BABYLON.Vector3(-1.5, 0.5, 0);
        leftSideStick.material = this.tankMaterial;
        leftSideStick.parent = this.tank;
        this.shadowGenerator.addShadowCaster(leftSideStick);

        const rightSideStick = BABYLON.MeshBuilder.CreateBox("rightSideStick", { width: 0.2, height: 1, depth: 0.2 }, this.scene);
        rightSideStick.position = new BABYLON.Vector3(1.5, 0.5, 0);
        rightSideStick.material = this.tankMaterial;
        rightSideStick.parent = this.tank;
        this.shadowGenerator.addShadowCaster(rightSideStick);


        const turret1 = BABYLON.MeshBuilder.CreateSphere("turret1", { diameter: 1.5 }, this.scene);
        turret1.position = new BABYLON.Vector3(0, 0.3, 0);
        turret1.material = this.tankMaterial;
        turret1.parent = this.tank;
        this.shadowGenerator.addShadowCaster(turret1);

        const turret2 = BABYLON.MeshBuilder.CreateSphere("turret2", { diameter: 0.8 }, this.scene);
        turret2.position = new BABYLON.Vector3(0, 0.6, 0);
        turret2.material = this.tankMaterial;
        turret2.parent = turret1;
        this.shadowGenerator.addShadowCaster(turret2);

        const gun = BABYLON.MeshBuilder.CreateCylinder("gun", { height: 3, diameter: 0.42 }, this.scene);
        gun.position = new BABYLON.Vector3(0, -0.2, 1.2);
        gun.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        gun.material = this.tankMaterial;
        gun.parent = turret2;
        this.shadowGenerator.addShadowCaster(gun);

        const wheelUV = [];
        wheelUV[0] = new BABYLON.Vector4(0, 0, 1, 1);
        wheelUV[1] = new BABYLON.Vector4(0, 0.5, 0, 0.5);
        wheelUV[2] = new BABYLON.Vector4(0, 0, 1, 1);

        this.wheels[0] = BABYLON.MeshBuilder.CreateCylinder("wheel0", { height: 0.5, diameter: 1.2, faceUV: wheelUV }, this.scene);
        this.wheels[0].rotation.z = Math.PI / 2;
        this.wheels[0].position = new BABYLON.Vector3(-1.8, 0, 1.3);
        this.wheels[0].material = this.wheelMaterial;
        this.shadowGenerator.addShadowCaster(this.wheels[0]);
        this.wheels[1] = BABYLON.MeshBuilder.CreateCylinder("wheel1", { height: 0.5, diameter: 1.2, faceUV: wheelUV }, this.scene);
        this.wheels[1].rotation.z = Math.PI / 2;
        this.wheels[1].position = new BABYLON.Vector3(1.8, 0, 1.3);
        this.wheels[1].material = this.wheelMaterial;
        this.shadowGenerator.addShadowCaster(this.wheels[1]);
        this.wheels[2] = BABYLON.MeshBuilder.CreateCylinder("wheel2", { height: 0.5, diameter: 1.2, faceUV: wheelUV }, this.scene);
        this.wheels[2].rotation.z = Math.PI / 2;
        this.wheels[2].position = new BABYLON.Vector3(-1.8, 0, -1.3);
        this.wheels[2].material = this.wheelMaterial;
        this.shadowGenerator.addShadowCaster(this.wheels[2]);
        this.wheels[3] = BABYLON.MeshBuilder.CreateCylinder("wheel3", { height: 0.5, diameter: 1.2, faceUV: wheelUV }, this.scene);
        this.wheels[3].rotation.z = Math.PI / 2;
        this.wheels[3].position = new BABYLON.Vector3(1.8, 0, -1.3);
        this.wheels[3].material = this.wheelMaterial;
        this.shadowGenerator.addShadowCaster(this.wheels[3]);


        const wheelsContainer = new BABYLON.Mesh("wheelsContainer", this.scene);
        wheelsContainer.addChild(this.wheels[0]);
        wheelsContainer.addChild(this.wheels[1]);
        wheelsContainer.addChild(this.wheels[2]);
        wheelsContainer.addChild(this.wheels[3]);

        wheelsContainer.parent = this.tank;


        this.tank.aggregate = new BABYLON.PhysicsAggregate(this.tank, BABYLON.PhysicsShapeType.BOX, {
            mass: 20
        }, this.scene);
        this.tank.physicsBody = this.tank.aggregate.body;
        this.tank.physicsBody.setLinearDamping(0.5);
        this.tank.physicsBody.setAngularDamping(1);

        if (this.isGunControlled) {
            var that = this;
            let currentLookAt;

            this.canvas.addEventListener("pointermove", function (event) {
                let pickResult = that.scene.pick(that.scene.pointerX, that.scene.pointerY);

                if (pickResult.hit) {
                    let newLookAt = new BABYLON.Vector3(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);

                    if (!currentLookAt) {
                        currentLookAt = newLookAt;
                    }

                    // Start a loop that will interpolate the rotation over time
                    let lerpValue = 0;
                    let lerpSpeed = 0.01;  // Adjust speed as needed
                    const lerpLoop = () => {
                        lerpValue += lerpSpeed;
                        currentLookAt = BABYLON.Vector3.Lerp(currentLookAt, newLookAt, lerpValue);

                        that.rotateGun(currentLookAt);

                        // Stop the loop when lerpValue is equal or greater than 1
                        if (lerpValue < 1) {
                            requestAnimationFrame(lerpLoop);
                        } else {
                            currentLookAt = newLookAt;
                        }
                    };
                    requestAnimationFrame(lerpLoop);
                }
            });
        }

        if (this.name !== "player") {
            // Create health bar
            const healthBarWidth = 100;
            const healthBarHeight = 10;
            const healthBarBackground = new Rectangle();
            healthBarBackground.width = `${healthBarWidth}px`;
            healthBarBackground.height = `${healthBarHeight}px`;
            healthBarBackground.color = "black";
            healthBarBackground.thickness = 1;
            healthBarBackground.background = "black";
            healthBarBackground.verticalAlignment = Rectangle.VERTICAL_ALIGNMENT_CENTER;
            healthBarBackground.horizontalAlignment = Rectangle.HORIZONTAL_ALIGNMENT_CENTER;
            healthBarBackground.isPointerBlocker = false; // Allow interactions with 3D scene behind the health bar
            this.advancedTexture.addControl(healthBarBackground);

            const healthBar = new Rectangle();
            healthBar.width = "0px";
            healthBar.height = `${healthBarHeight}px`;
            healthBar.color = "red";
            healthBar.thickness = 1;
            healthBar.background = "red"
            healthBar.verticalAlignment = Rectangle.VERTICAL_ALIGNMENT_CENTER;
            healthBar.horizontalAlignment = Rectangle.HORIZONTAL_ALIGNMENT_LEFT;
            healthBar.isPointerBlocker = false; // Allow interactions with 3D scene behind the health bar
            this.advancedTexture.addControl(healthBar);

            this.healthBar = healthBar;

            // Adjust the health bar's position relative to the tank (you may need to fine-tune this based on your tank's model)
            healthBarBackground.linkWithMesh(this.tank);
            healthBarBackground.linkOffsetY = -30;

            healthBar.linkWithMesh(this.tank);
            healthBar.linkOffsetY = -30;
        }
    }

    transformForce(mesh, vec) {
        if (this.tank.health <= 0) {
            return;
        }

        var mymatrix = new BABYLON.Matrix();
        mesh.rotationQuaternion.toRotationMatrix(mymatrix);
        return BABYLON.Vector3.TransformNormal(vec, mymatrix);
    };

    updateHealthBar() {
        if (this.tank.health >= 0 && this.name !== "player") {
            const healthPercentage = this.tank.health / 100;
            const healthBarWidth = 100; // Or any desired max width
            const newWidth = healthBarWidth * healthPercentage;
            this.healthBar.width = `${newWidth}px`;
            // align it to the left
            // Calculate the position from the left edge based on health percentage
            const maxOffsetX = healthBarWidth / 2;
            const currentOffsetX = maxOffsetX - (newWidth / 2);
            this.healthBar.linkOffsetX = `-${currentOffsetX}px`;
        }
    }

    rotateGun(lookAt) {
        if (this.tank.health <= 0) {
            return;
        }

        let forward = new BABYLON.Vector3(0, 0, 1);
        let tankForward = this.tank.rotationQuaternion.toEulerAngles().y;
        forward = BABYLON.Vector3.TransformNormal(forward, BABYLON.Matrix.RotationAxis(BABYLON.Axis.Y, tankForward));

        let direction = lookAt.subtract(this.tank.getAbsolutePosition());
        direction.y = 0;
        direction.normalize();

        let angle = Math.acos(BABYLON.Vector3.Dot(forward, direction));
        let cross = BABYLON.Vector3.Cross(forward, direction);
        if (cross.y < 0) angle *= -1;

        if (angle < -1.2) angle = -1.2;
        if (angle > 1.2) angle = 1.2;

        this.tank.getChildTransformNodes()[2].rotation.y = angle;
    }

    rotateTank(lookAt) {
        if (this.tank.health <= 0) {
            return;
        }

        let forward = new BABYLON.Vector3(0, 0, 1);
        let tankForward = this.tank.rotationQuaternion.toEulerAngles().y;
        forward = BABYLON.Vector3.TransformNormal(forward, BABYLON.Matrix.RotationAxis(BABYLON.Axis.Y, tankForward));

        let direction = lookAt.subtract(this.tank.getAbsolutePosition());
        direction.y = 0;
        direction.normalize();

        let angle = Math.acos(BABYLON.Vector3.Dot(forward, direction));
        this.tank.physicsBody.setAngularVelocity(new BABYLON.Vector3(0, angle, 0), this.tank.getAbsolutePosition());
    }

    rotate(mesh, direction, power) {
        if (this.tank.health <= 0) {
            return;
        }

        let velocity = new BABYLON.Vector3(0, 0, 0);
        mesh.physicsBody.getAngularVelocityToRef(velocity);

        if (velocity.length() > this.maxRotationSpeed) {
            return;
        }

        mesh.physicsBody.setAngularVelocity(
            this.transformForce(mesh, direction.scale(power)).add(velocity),
            mesh.getAbsolutePosition()
        );
    }

    translate(mesh, direction, power) {
        if (this.tank.health <= 0) {
            return;
        }

        let velocity = new BABYLON.Vector3(0, 0, 0);
        mesh.physicsBody.getLinearVelocityToRef(velocity);

        if (velocity.length() > this.maxTankSpeed) {
            return;
        }

        mesh.physicsBody.setLinearVelocity(
            this.transformForce(mesh, direction.scale(power)).add(velocity),
            mesh.getAbsolutePosition()
        );
    }

    applyBreak(mesh, power) {
        if (this.tank.health <= 0) {
            return;
        }

        let velocity = new BABYLON.Vector3(0, 0, 0);
        mesh.physicsBody.getLinearVelocityToRef(velocity);
        velocity.scaleInPlace(-1);
        velocity.normalize();
        velocity.scaleInPlace(power);
        mesh.physicsBody.applyImpulse(
            velocity,
            mesh.getAbsolutePosition()
        );
    }

    createBullet() {
        if (this.tank.health <= 0) {
            return;
        }

        let bullet = BABYLON.MeshBuilder.CreateCylinder("bullet", { diameter: 0.2, height: 0.8 }, this.scene);
        bullet.material = new BABYLON.StandardMaterial("bulletMaterial", this.scene);
        bullet.material.diffuseColor = new BABYLON.Color3(1, 0.95, 0.5); // change to the color you prefer
        this.shadowGenerator.addShadowCaster(bullet);

        let gun = this.tank.getChildTransformNodes()[2].getChildTransformNodes()[0].getChildTransformNodes()[0];

        let gunQuaternion = gun.absoluteRotationQuaternion;
        let bulletOffset = gun.getDirection(new BABYLON.Vector3(0, 2, 0)).scale(1);  // Adjust scale value to match the size of your gun
        bullet.position = gun.getAbsolutePosition().add(bulletOffset);
        bullet.rotationQuaternion = gunQuaternion.clone();

        bullet.aggregate = new BABYLON.PhysicsAggregate(bullet, BABYLON.PhysicsShapeType.CYLINDER, {
            mass: 1
        }, this.scene);
        bullet.physicsBody = bullet.aggregate.body;

        let forceDirection = bullet.getDirection(new BABYLON.Vector3(0, 1, 0));
        bullet.physicsBody.applyImpulse(
            forceDirection.scale(100),
            bullet.getAbsolutePosition()
        );

        // Add a recoil to the tank when the bullet is fired
        let recoilForce = forceDirection.scale(-20);
        this.tank.physicsBody.applyImpulse(
            recoilForce,
            this.tank.getAbsolutePosition()
        );
        setTimeout(() => {
            if (this.tank && this.tank.health > 0) {
                let recoilForceBack = forceDirection.scale(18);
                this.tank.physicsBody.applyImpulse(
                    recoilForceBack,
                    this.tank.getAbsolutePosition()
                );
            }
        }, 100);


        bullet.physicsBody.setCollisionCallbackEnabled(true);

        // You have two options:
        // Body-specific callback
        const observable = bullet.physicsBody.getCollisionObservable();
        const observer = observable.add((collisionEvent) => {
            bullet.physicsBody.setCollisionCallbackEnabled(false);
            bullet.physicsBody.setLinearVelocity(new BABYLON.Vector3(0, 0, 0), bullet.getAbsolutePosition());
            bullet.physicsBody.setAngularVelocity(new BABYLON.Vector3(0, 0, 0), bullet.getAbsolutePosition());
            bullet.dispose();

            if (collisionEvent.collidedAgainst.transformNode.name === "enemy" || collisionEvent.collidedAgainst.transformNode.name === "player") {
                collisionEvent.collidedAgainst.transformNode.health -= 5;
            }
        });
    }

    update(mf, mb, rl, rr, br, isShoot) {
        if (this.tank.health <= 0) {
            return;
        }

        let v1 = new BABYLON.Vector3(0, 0, 0);
        let v2 = new BABYLON.Vector3(0, 0, 0);

        this.tank.physicsBody.getLinearVelocityToRef(v1);
        this.tank.physicsBody.getAngularVelocityToRef(v2);

        if (v1.length() < 0.01) {
            this.tank.physicsBody.setLinearVelocity(new BABYLON.Vector3(0, 0, 0), this.tank.getAbsolutePosition());
        }
        if (v2.length() < 0.01) {
            this.tank.physicsBody.setAngularVelocity(new BABYLON.Vector3(0, 0, 0), this.tank.getAbsolutePosition());
        }

        if (mf) {
            this.tank.direction = 1;
            this.translate(this.tank, new BABYLON.Vector3(0, 0, 1), this.tankSpeed);
        }
        if (mb) {
            this.tank.direction = -1;
            this.translate(this.tank, new BABYLON.Vector3(0, 0, -1), this.tankSpeed);
        }
        if (rr) {
            this.rotate(this.tank, new BABYLON.Vector3(0, this.tank.direction, 0), this.rotationSpeed);

            this.steeringAngle = Math.min(this.steeringAngle + this.rotationSpeed, this.maxSteeringAngle);
            this.wheels[0].rotation.y = this.steeringAngle;
            this.wheels[1].rotation.y = this.steeringAngle;
            this.wheels[2].rotation.y = this.steeringAngle * 0.2;
            this.wheels[3].rotation.y = this.steeringAngle * 0.2;
        }
        if (rl) {
            this.rotate(this.tank, new BABYLON.Vector3(0, -this.tank.direction, 0), this.rotationSpeed);

            this.steeringAngle = Math.max(this.steeringAngle - this.rotationSpeed, -this.maxSteeringAngle);
            this.wheels[0].rotation.y = this.steeringAngle;
            this.wheels[1].rotation.y = this.steeringAngle;
            this.wheels[2].rotation.y = this.steeringAngle * 0.2;
            this.wheels[3].rotation.y = this.steeringAngle * 0.2;
        }

        if (!rl && !rr) {
            if (this.steeringAngle > 0) {
                this.steeringAngle = Math.max(this.steeringAngle - this.rotationSpeed, 0);
            } else if (this.steeringAngle < 0) {
                this.steeringAngle = Math.min(this.steeringAngle + this.rotationSpeed, 0);
            }
            this.wheels[0].rotation.y = this.steeringAngle;
            this.wheels[1].rotation.y = this.steeringAngle;
            this.wheels[2].rotation.y = this.steeringAngle * 0.2;
            this.wheels[3].rotation.y = this.steeringAngle * 0.2;
        }

        if (br) {
            this.applyBreak(this.tank, this.breakForce);
        }
        if (isShoot) {
            let currentTime = new Date().getTime();
            if (currentTime - this.lastBulletTime > this.shootGap) {
                this.lastBulletTime = currentTime;
                this.createBullet();
            }
        }

        let distanceMoved = BABYLON.Vector3.Distance(this.tank.position, this.tank.previousPosition);
        let wheelRotation = distanceMoved / (this.wheels[0].getBoundingInfo().boundingBox.extendSize.z * Math.PI * 2);
        for (let wheel of this.wheels) {
            wheel.rotation.x += wheelRotation * this.tank.direction * 10;
        }
        this.tank.previousPosition = this.tank.position.clone();

        this.updateHealthBar();
    }
}

export default Tank;
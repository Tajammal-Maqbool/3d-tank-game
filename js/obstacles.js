import * as BABYLON from 'babylonjs';


class Obstacles {
    constructor(scene, shdaowGenerator) {
        this.scene = scene;
        this.shadowGenerator = shdaowGenerator;

        this.material = new BABYLON.StandardMaterial("obstacleMat", this.scene);
        this.material.diffuseTexture = new BABYLON.Texture("https://t3.ftcdn.net/jpg/01/69/83/36/360_F_169833636_K0rpNa68keobmQrDhEUn1nbFcy8cmfCw.jpg");

        this.createObstacles();
    }

    createObstacles() {
        const SIZE = 2;
        const OFFSET = 2.5;

        this.createMultipleObstacles(
            21,
            "leftWall",
            SIZE,
            new BABYLON.Vector3(-30, 0, OFFSET),
            OFFSET,
            new BABYLON.Vector3(0, 0, 1)
        );
        this.createMultipleObstacles(
            6,
            "leftWall2",
            SIZE,
            new BABYLON.Vector3(-30, SIZE, 0),
            OFFSET,
            new BABYLON.Vector3(0, 0, 1)
        );
        this.createMultipleObstacles(
            21,
            "rightWall",
            SIZE,
            new BABYLON.Vector3(30, 0, OFFSET),
            OFFSET,
            new BABYLON.Vector3(0, 0, 1)
        );
        this.createMultipleObstacles(
            8,
            "rightWall2",
            SIZE,
            new BABYLON.Vector3(30, SIZE, OFFSET * 2),
            OFFSET,
            new BABYLON.Vector3(0, 0, 1)
        );
        this.createMultipleObstacles(
            25,
            "topWall",
            SIZE,
            new BABYLON.Vector3(-30, 0, 21 * OFFSET),
            OFFSET,
            new BABYLON.Vector3(1, 0, 0)
        );
        this.createMultipleObstacles(
            10,
            "topWall2",
            SIZE,
            new BABYLON.Vector3(-30, SIZE, 21 * OFFSET),
            OFFSET,
            new BABYLON.Vector3(1, 0, 0)
        );
        this.createMultipleObstacles(
            25,
            "bottomWall",
            SIZE,
            new BABYLON.Vector3(-30, 0, 0),
            OFFSET,
            new BABYLON.Vector3(1, 0, 0)
        );
        this.createMultipleObstacles(
            5,
            "centerObstacles1",
            SIZE,
            new BABYLON.Vector3(-20, 0, 20),
            2 * OFFSET,
            new BABYLON.Vector3(1, 0, 1)
        );
        this.createMultipleObstacles(
            5,
            "centerObstacles2",
            SIZE,
            new BABYLON.Vector3(0, 0, 40),
            2 * OFFSET,
            new BABYLON.Vector3(1, 0, -1)
        );
        this.createMultipleObstacles(
            2,
            "centerObstacles3",
            SIZE,
            new BABYLON.Vector3(8, 0, 20),
            OFFSET,
            new BABYLON.Vector3(1, 0, 0)
        );
        this.createMultipleObstacles(
            2,
            "centerObstacles4",
            SIZE,
            new BABYLON.Vector3(-8, 0, 20),
            OFFSET,
            new BABYLON.Vector3(1, 0, 0)
        );
    }

    createMultipleObstacles(count, obstacleName, size, startPosition, offset, direction) {
        let parent = new BABYLON.Mesh(obstacleName, this.scene);
        parent.position = startPosition;

        for (var i = 0; i < count; i++) {
            this.createObstacle(
                obstacleName + i,
                Math.random() > 0.5 ? "box" : "cylinder",
                size,
                new BABYLON.Vector3(
                    (offset * i * direction.x),
                    (offset * i * direction.y) + size / 2,
                    (offset * i * direction.z)
                ),
                parent
            );
        }
    }

    createObstacle(obstacleName, type, size, position, parent) {
        let obstacle = null;
        if (type === "box") {
            obstacle = BABYLON.MeshBuilder.CreateBox(obstacleName, { size: size }, this.scene)
        }
        else if (type === "cylinder") {
            obstacle = BABYLON.MeshBuilder.CreateCylinder(obstacleName, { height: size, diameter: size }, this.scene)
        }
        obstacle.position = position;
        obstacle.material = this.material;
        obstacle.parent = parent;
        this.shadowGenerator.addShadowCaster(obstacle);


        obstacle.aggregate = new BABYLON.PhysicsAggregate(obstacle, BABYLON.PhysicsShapeType.BOX, {
            mass: 0
        }, this.scene);

        return obstacle;
    }
}

export default Obstacles;
require('@tensorflow/tfjs-node');
const MongoClient = require("mongodb").MongoClient;

const canvas = require('canvas');
const faceapi = require('@vladmandic/face-api');
const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const express = require('express');
const app = express();
app.use(express.static('client'));
app.use(express.json({ limit: '100mb' }));

let globalFaceMatcher;
let collection;

const config = {
    // address: '192.168.1.2',
    address: '127.0.0.1',
    port: 3000,
    unknownlabel: '🤷‍♂️',
    dburl: 'mongodb://localhost:27017/',
    db: 'faceRecognition',
    collection: 'faces',
    modelsdir: __dirname + '/models',
    facematcherparam: 0.6,
    canvasFontSize: 20,
    squareSize: 600,
    supportedTypes: ['png', 'jpg', 'jfif', 'jpeg'],
    imagesLength: 5
}

const server = app.listen(config.port, config.address, async () => {
    connect()
    .then(async (res) => {
        console.log("Connected to database");
        collection = res.db(config.db).collection(config.collection);
        console.log("Connected to collection");
        await loadModels();
        console.log("Models loaded");
        globalFaceMatcher = await createFaceMatcherFromDB();
        console.log("Face matcher created");
        console.log(`Server run at ${config.address}:${config.port}`);
    }).catch(() => {
        console.log("Failed to connect to database. Closing server");
        server.close();
    });
});

app.get('/reg', (req, res) => {
    res.sendFile(__dirname + '/client/register.html');
});

app.post('/api', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (isSupportedType(req.body.image)) { // if image is supported
        const image = await createImage(req.body.image);
        const detections = await getDetections(image);
        if (detections.length) { // if there is faces on image
            const canvas = new Canvas();
            const displaySize = fitSizes(image.width, image.height, config.squareSize);
            faceapi.matchDimensions(canvas, displaySize);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const matches = resizedDetections.map(d => globalFaceMatcher.findBestMatch(d.descriptor));
            const labels = matches.filter(d => d.label != 'unknown').map(d => d.label);
            const drawOptions = {
                lineWidth: 2,
                drawLabelOptions: {
                    fontSize: config.canvasFontSize
                }
            }
            matches.forEach((match, i) => {
                const box = resizedDetections[i].detection.box;
                drawOptions.label = (match.label == 'unknown' ? config.unknownlabel : match.label);
                const drawBox = new faceapi.draw.DrawBox(box, drawOptions);
                drawBox.draw(canvas);
            });

            // if there is labeled images, not '?'
            if (labels.length) {
                // try to connect to DB and fetch id`s
                collection.find({_id: {$in: labels}}, {projection: {descriptors: 0}}).toArray()
                .then(result => {
                    res.json({
                        data: result,
                        faces: matches.length,
                        recognized: result.length,
                        canvas: canvas.toDataURL()
                    });
                })
                .catch(() => {
                    res.json({ 
                        error: 1,
                        faces: matches.length,
                        recognized: labels.length,
                        canvas: canvas.toDataURL()
                    })
                });
            } else {
                res.json({
                    faces: matches.length,
                    recognized: 0,
                    canvas: canvas.toDataURL()
                });
            }
        } else { res.json({ faces: 0 }); }
    } else { res.json({ faces: 0} ); }
});

app.post('/add', async (req, res) => {
    /*
    error: 0 - no error
    error: 1 - validation not passed
    error: 2 - face count error (each image must contain only one face)
    error: 3 - cannot connect to database to insert person
    */
    const data = req.body;
    const validation = await validateAddData(data);
    const validated = !Object.values(validation).some(e => e !== true && e === 'dberror');
    if (validated) {
        const detections = [];

        // create faces[] containing amount of faces
        for (img of data.images) {
            const image = await createImage(img);
            const d = await getDetections(image);
            detections.push(d);
        }
        // check if faces[] contains only 1`s
        if (detections.some(e => e.length != 1)) {
            res.json({
                error: 2,
                faces: detections.map(e => e.length)
            });
        } else { // all images contain only 1 face
            const descriptors = detections.map(e => Object.values(e[0].descriptor));
            collection.insertOne({
                _id: data.id,
                phone: data.phone,
                bdate: data.bdate,
                address: data.place,
                label: data.pib,
                descriptors: descriptors
            })
            .then(() => {
                // update face matcher
                const newPerson = new faceapi.LabeledFaceDescriptors(data.id, descriptors.map(descriptor => new Float32Array(descriptor)));
                globalFaceMatcher.labeledDescriptors.push(newPerson);
                res.json( {error: 0} );
            })
            .catch((err) => {
                console.log(err);
                res.json( {error: 3} );
            });
        }
    } else {
        res.json({
            error: 1,
            validation: validation
        });
    }
});

async function loadModels() {
    faceapi.nets.faceRecognitionNet.loadFromDisk(config.modelsdir);
    faceapi.nets.faceLandmark68Net.loadFromDisk(config.modelsdir);
    faceapi.nets.ssdMobilenetv1.loadFromDisk(config.modelsdir);
}

async function createFaceMatcherFromDB() {
    const result = await collection.find({}, { projection: { _id: 1, descriptors: 1 } }).toArray();

    const faces = result.map(face => new faceapi.LabeledFaceDescriptors(
            face._id, 
            face.descriptors.map(descriptor => new Float32Array(descriptor))
        )
    );

    return new faceapi.FaceMatcher(faces, config.facematcherparam);
}

async function getDetections(image) {
    return faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
}

async function createImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function validateAddData(data) {
    const obj = {
        imagelength: true,
        allsupportedimages: true,
        idlen: true,
        idunique: true,
        pib: true,
        phone: true,
        bdate: true,
        place: true
    };
    if (data.images.length != config.imagesLength) {
        obj.imagelength = false;
    }
    if (data.images.some(e => !isSupportedType(e))) {
        obj.allimages = false;
    }
    if (!data.id.match(/^\d{10}$/)) {
        obj.idlen = false;
    }
    await dbHasId(data.id)
    .then(res => { if (res) { obj.idunique = false } })
    .catch(() => { obj.idunique = 'dberror' });
    if (!data.pib.match(/^([A-ZА-ЯҐЄІЇ]{1}[a-zа-яґєії]+(\s|$)){3}$/u)) {
        obj.pib = false;
    }
    if (!data.phone.match(/^(\+380)\d{9}$/)) {
        obj.phone = false;
    }
    if (!data.bdate) {
        obj.bdate = false;
    }
    if (!data.place) {
        obj.place = false;
    }
    return obj;
}

function isSupportedType(base64Image) {
    if (base64Image) {
        for (type of config.supportedTypes) {
            if (base64Image.startsWith(`data:image/${type}`)) return true;
        }
    }
    return false;
}

async function dbHasId(id) {
    return new Promise((resolve, reject) => {
        collection.findOne({_id: id}, {projection: {_id: 1}})
        .then(res => { resolve(res ? true : false) })
        .catch(err => { reject(err) });
    });
}

async function connect() {
    return new Promise((resolve, reject) => {
        MongoClient
        .connect(config.dburl, { useUnifiedTopology: true })
        .then((client) => { resolve(client) })
        .catch(err => { reject(err) });
    });
}

function fitSizes(imgW, imgH, fitSize) {
    let size = { width: imgW, height: imgH };
    const ratio = imgW/imgH;
    if (imgW > fitSize || imgH > fitSize) {
        if (imgW > imgH) {
            size.width = fitSize;
            size.height = Math.floor(fitSize/ratio);
        } else {
            size.width = Math.floor(fitSize*ratio);
            size.height = fitSize;
        }
    }
    return size;
}
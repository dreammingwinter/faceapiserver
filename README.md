# faceapiserver
This is my diploma work for https://tc.lviv.ua/, used technologies: node/express/mongo

This app creates server which can handle requests for searching people by photo and adding more people to database.

# MongoDB
To start you should install mongodb service on your PC and pull this repository.

After that just create database "faceRecognition" with collection "faces" and you are done with configurating DB.

You can add some pre-made landmarks from faces.json file.

Mongodb: https://www.mongodb.com/try/download

Also you can move DB to cloud by yourself.

# Canvas
The main issue with this project was the node/canvas library on Windows. It requires some extra programs to be install. Link: https://www.npmjs.com/package/canvas

# Run
To run this project just run .bat file (it runs and stops mongodb so you couldn`t do it manually all the time).

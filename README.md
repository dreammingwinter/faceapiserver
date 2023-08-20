# faceapiserver
This is my diploma work for https://tc.lviv.ua/
Used technologies: NodeJS/Express/MongoDB

This app creates a server which can handle requests for searching people by photo and adding more people to a database.

# MongoDB
To start you should install mongodb service on your PC and pull this repository.

Mongodb: https://www.mongodb.com/docs/manual/installation/

After that just create a database "faceRecognition" with a collection "faces" and you are done with configuring the DB.

You can add some pre-made landmarks from faces.json file.

Also you can move DB to cloud by yourself.

# Canvas
The main issue with this project was the node/canvas library on Windows. It requires some extra programs to be installed.

Link: https://www.npmjs.com/package/canvas

Once you have everything for canvas installed
## Tensorflow
In you project directory run:
`npm rebuild @tensorflow/tfjs-node build-addon-from-source`

Common error: The specified module could not be found. node_modules\@tensorflow\tfjs-node\lib\napi-v6\tfjs_binding.node

Fix: https://github.com/tensorflow/tfjs/issues/4116#issuecomment-719940801

# Run
To run this project just run .bat file (it runs and stops mongodb so you shouldn't do it manually all the time).

# Thanks
Thanks to @vladmandic for his updates to face-api.js library, it helped me a lot.

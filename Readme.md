# Build Node-Express-Typescript Docker Image

## _Building a docker images_

In this project, will create an application image for a static website that uses the Express with typescript.

- Create an express application with typescript.
- Create docker file.
- Build and launch the image.

## Let's start

### 1. Installing Your Application Dependencies

To create your image, you will first need to make your application files
Create a folder and navigate to directory

```sh
mkdir node-app && cd node-app
```

Generate an empty npm project without going through an interactive process.

```sh
npm init -y
```

or

```
yarn init -y
```

This will generate a `package.json` file for project dependencies or use the following json data

```json
{
  "name": "blackcoffer",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon index.ts",
    "build": "rimraf ./dist && tsc && cp -r public/ dist/",
    "start": "node dist/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "Navneet Maurya",
  "license": "ISC",
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "mongoose": "^6.8.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.15",
    "nodemon": "^2.0.20",
    "rimraf": "^3.0.2",
    "tslint": "^6.1.3",
    "typescript": "^4.9.4"
  }
}
```

It is requred to add `cp -r public/ dist/` in buld command because `tsc` will not automatically copy this folder.

This file includes the project name, author, and license under which it is being shared. npm recommends making your project name short and descriptive, and avoiding duplicates in the npm registry.

Additionally, the file specifies:

- `main`: The entrypoint for the application, index.ts. You will create this file next.
- `dependencies`: The project dependencies — in this case, Express 4.18.2 or above.

Now install the dependencies with the following command

```sh
npm install
```

or

```
yarn
```

### 2. Creating the Application Files

Open `index.ts` in the main project directory to define the project’s routes.

```
nano index.ts
```

Add the following lines.

```javascript
import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import AppError from "./utils/appError";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use("*", cors());

mongoose
  .connect("mongodb://localhost:27017/example")
  .then((con) => {
    console.log("DB Connected succesfull.......");
  })
  .catch(() => {
    console.log("DB Connected Failed.......");
  });

app.use(express.static(path.join(__dirname, "public")));

// View

// API
app.use("/api/v1", (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "You are connected succesfully.",
  });
});

app.all("*", (req, res, next) => {
  next(new AppError("Con't find the " + req.originalUrl + " url", 404));
});

// Error
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  // Small error handler
  const statusCode = err.statusCode || 500;
  const status = err.status;
  const message = err.message;
  const isOperational = err.isOperational;
  const stack = err.stack;
  if (req.originalUrl.startsWith("/api")) {
    if (isOperational) {
      return res.status(statusCode).json({
        status,
        message,
        stack,
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Please try again later!",
      stack,
    });
  }
  res.sendFile(__dirname + "/public/index.html");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server started on http://localhost:${port}`);
});
```

Create an `tsconfig.json` in your project directory and add following data.

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "target": "es6",
    "moduleResolution": "node",
    "sourceMap": true,
    "outDir": "dist"
  },
  "include": ["./**/*"],
  "exclude": ["node_modules", "**/*.spec.ts", "dist"],
  "lib": ["es2015"]
}
```

Next, add some static content to the application. Start by creating the public directory, create the `index.html` file and add some code.

```sh
mkdir public
```

```
nano public/index.html
```

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Express App</title>
    <style>
      * {
        padding: 0;
        margin: 0;
      }
      .body {
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(90deg, #00c9ff 0%, #92fe9d 100%);
      }
      h1 {
        color: azure;
        font-size: 72px;
        font-weight: 900;
      }
    </style>
  </head>
  <body>
    <div class="body">
      <h1>App is ready!</h1>
    </div>
  </body>
</html>
```

To start the application, make sure that you are in your project’s root directory.

```bash
npm run build && npm start
```

Navigate your browser to http://your_server_ip:8080.

### 3. Writing the Dockerfile

Your Dockerfile specifies what will be included in your application container when it is executed. Using a Dockerfile allows you to define your container environment and avoid discrepancies with dependencies or runtime versions.
Create a `Dockerfile`.

```sh
nano Dockerfile
```

Add the `FROM` instruction to set the application’s base image.

```dockerfile
FROM node
```

This image includes Node.js and npm.
By default, the Docker Node image includes a non-root node user that you can use to avoid running your application container as root.
Create a `app` directory and set ownership on that to `node` user.

```dockerfile
...
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
```

Next, set the working directory of the application to `/home/node/app`.

```dockerfile
...
WORKDIR /home/node/app
```

Switch the user to node before running npm install.

```dockerfile
...
USER node
```

Install the dependencies and build the project.

```dockerfile
RUN npm install && npm run build
```

Copy your application code with the appropriate permissions.

```dockerfile
...
COPY --chown=node:node . .
```

Finally, expose port 8080 on the container and start the application:

```dockerfile
...
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

This is the complete Dockerfile:

```dockerfile
FROM node
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node . .
USER node
RUN npm install && npm run build
EXPOSE 3000
CMD [ "node", "dist/index.js" ]
```

Open the .dockerignore file.

```sh
nano .dockerignore
```

Inside the file, add your local node modules, npm logs, Dockerfile, and .dockerignore file.

```.dockerignore
node_modules
dist
npm-debug.log
Dockerfile
.dockerignore
```

You are now ready to build the application image using the docker build command.

```sh
docker build -t my-node-app:latest .
```

Once it is complete, check your images.

```sh
docker images
```

Run the following command to build the container

```sh
docker run --name node-app -p 80:3000 -d my-node-app
```

Once your container is up and running, you can inspect a list of your running containers with docker ps.

```sh
docker ps
```

With your container running, you can now visit your application by navigating your browser to `http://your_server_ip`.

This repo can be used to quick start with this project.

# Thanks

import express, { Router } from "express";

import pkg from "body-parser";
import methodOverride from "method-override";
import mongoose, { mongo } from "mongoose";
import http from "http";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { secret } from "./config/config.js";
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

const router = Router();

router.get("/", (req, res) => {
    res.send("Hello World!");
});


mongoose.connect("mongodb://127.0.0.1:27017/resources");

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

db.once("open", () => {
    console.log("Connected to MongoDB");

    app.listen(3000, () => {
        console.log("Server running on port 3000");
    });
}
);

const ResourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["UI_UX", "Development", "SEO", "Security", "Stock", "Learning", "Other"],
        required: true,

    },
    description: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    tags: {
        type: [String],
        required: true,
    },
    reports: {
        type: Number,
        default: 0,

    },
});

const UserSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,

    },
    role: {
        type: String,
        enum: ["user", "admin"],
        required: true,
    },

});

const Resource = mongoose.model("Resource", ResourceSchema);
const User = mongoose.model("User", UserSchema);

router.get("/resources", async (req, res) => {
    await Resource.find().then((resources) => {
        res.json(resources);
    }).catch((err) => {
        res.status(500).send(err);
    });
});

router.post("/token", async (req, res) => {

    const user = req.body;
    const username = user.username;
    const password = user.password;


    await User.findOne({ username }).exec().then((user) => {

        if (user) {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    const token = jwt.sign({ id: user._id }, secret, {
                        expiresIn: 86400, // 24 hours
                    });
                    res.status(200).send({
                        id: user._id,
                        username: user.username,
                        role: user.role,
                        accessToken: token,
                    });


                } else {
                    res.status(401).send("Contraseña incorrecta");
                }
            });
        } else {
            res.status(401).send("Usuario no encontrado");
        }

    });




});





router.post("/resources", async (req, res) => {
    let token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({ message: "No token provided!" });
    }

    const verify = jwt.verify(token,
        secret
    );

    if (!verify) {
        return res.status(401).send({
            message: "Unauthorized!",
        });
    }
    const resource = new Resource(req.body);
    try {
        await resource.save();
        res.send(resource);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get("/resources/:id", async (req, res) => {
    await Resource.find({

        id: { $in: [req.params.id] }
    }).
        select({ id: 1, name: 1, type: 1, description: 1, url: 1, reports: 1, tags: 1 }).
        exec().then((resource) => {
            res.json(resource);
        }).catch((err) => {
            res.send(err);
        });
}
);

router.put("/resources/:id", async (req, res) => {
    let token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({ message: "No token provided!" });
    }

    const verify = jwt.verify(token,
        secret
    );

    if (!verify) {
        return res.status(401).send({
            message: "Unauthorized!",
        });
    }
    await Resource.findByIdAndUpdate(req.params.id, req.body).then((resource) => {
        res.json(resource);
    }).catch((err) => {
        res.status(500).send(err);
    });
});

router.delete("/resources/:id", async (req, res) => {
    let token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({ message: "No token provided!" });
    }

    const verify = jwt.verify(token,
        secret
    );

    if (!verify) {
        return res.status(401).send({
            message: "Unauthorized!",
        });
    }

    await Resource.findByIdAndDelete(req.params.id).then((resource) => {
        res.json(resource);
    }).catch((err) => {
        res.status(500).send(err);
    });
}
);

// get by type
router.get("/resources/type/:type", async (req, res) => {
    await Resource.find({

        type: req.params.type
    }
    ).
        select({ id: 1, name: 1, type: 1, description: 1, url: 1, reports: 1, tags: 1 }).
        exec().then((resource) => {
            res.json(resource);
        }).catch((err) => {
            res.send(err);
        });
});


// get by tag
router.get("/resources/tag/:tag", async (req, res) => {
    await Resource.find({

        tags: { $in: [req.params.tag] }
    }).
        select({ id: 1, name: 1, type: 1, description: 1, url: 1, reports: 1, tags: 1 }).
        exec().then((resource) => {
            res.json(resource);
        }).catch((err) => {
            res.send(err);
        });
}
);

// get by name
router.get("/resources/name/:name", async (req, res) => {
    await Resource.find({

        name: req.params.name
    }).
        select({ id: 1, name: 1, type: 1, description: 1, url: 1, reports: 1, tags: 1 }).
        exec().then((resource) => {
            res.json(resource);
        }).catch((err) => {
            res.send(err);
        });
});



app.use(router);




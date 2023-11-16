import mongoose, { Schema } from "mongoose";


Schema = mongoose.Schema;


const ResourceSchema = new Schema({
    name: String,
    type: {
        type: String,
        enum: ["UI_UX", "Development", "SEO", "Security", "Stock", "Learning", "Other"],

    },
    description: String,
    link: String,
    tags: [String],
});

export default mongoose.model("Resource", ResourceSchema);
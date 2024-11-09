export const defaultOverrides = {
    "chatqna-retriever-usvc-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": process.env.HUGGING_FACE_TOKEN || process.env.HUGGINGFACEHUB_API_TOKEN || ""
        }
    },
    "chatqna-data-prep-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": process.env.HUGGING_FACE_TOKEN || process.env.HUGGINGFACEHUB_API_TOKEN || ""
        }
    }
}
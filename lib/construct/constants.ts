export const HuggingFaceToken = process.env.HUGGING_FACE_TOKEN || process.env.HUGGINGFACEHUB_API_TOKEN || ""
export const defaultOverrides = {
    "chatqna-retriever-usvc-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-guardrails-usvc-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-data-prep-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-tgi-guardrails-config": {
        "data": {
            "HF_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-tgi-config": {
        "data": {
            "HF_TOKEN": HuggingFaceToken
        }
    }
}
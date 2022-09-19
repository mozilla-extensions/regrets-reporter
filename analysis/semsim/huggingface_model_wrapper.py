from huggingface_hub import PyTorchModelHubMixin
from huggingface_hub.constants import PYTORCH_WEIGHTS_NAME
from huggingface_hub.file_download import hf_hub_download
from unifiedmodel import RRUM
import os
import torch


class YoutubeVideoSimilarityModel(RRUM, PyTorchModelHubMixin):
    """
        Hugging Face `PyTorchModelHubMixin` wrapper for RegretsReporter `RRUM` model.
        This allows loading, using, and saving the model from Hugging Face model hub
        with default Hugging Face methods `from_pretrained` and `save_pretrained`.
    """
    @classmethod
    def _from_pretrained(
        cls,
        model_id,
        revision,
        cache_dir,
        force_download,
        proxies,
        resume_download,
        local_files_only,
        use_auth_token,
        map_location="cpu",
        strict=False,
        **model_kwargs,
    ):
        map_location = torch.device(map_location)

        if os.path.isdir(model_id):
            print("Loading weights from local directory")
            model_file = os.path.join(model_id, PYTORCH_WEIGHTS_NAME)
        else:
            model_file = hf_hub_download(
                repo_id=model_id,
                filename=PYTORCH_WEIGHTS_NAME,
                revision=revision,
                cache_dir=cache_dir,
                force_download=force_download,
                proxies=proxies,
                resume_download=resume_download,
                use_auth_token=use_auth_token,
                local_files_only=local_files_only,
            )
        # convert Huggingface config to RRUM acceptable input parameters
        if "config" in model_kwargs:
            model_kwargs = {**model_kwargs["config"], **model_kwargs}
            del model_kwargs["config"]
        model = cls(**model_kwargs)

        state_dict = torch.load(model_file, map_location=map_location)
        model.load_state_dict(state_dict, strict=strict)
        model.eval()

        return model

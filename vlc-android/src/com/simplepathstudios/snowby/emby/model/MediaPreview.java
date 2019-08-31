package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.util.SnowbySettings;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public abstract class MediaPreview {
    public HashMap<String,String> ImageTags = new HashMap<>();
    public String Type;
    public String Id;
    public int ParentBackdropItemId;
    public List<String> ParentBackdropImageTags = new ArrayList<String>();
    public UserData UserData;
    public String ParentThumbItemId;
    public String ParentThumbImageTag;
    protected boolean resumeImage;

    protected MediaPreview(){
        this(false);
    }

    protected MediaPreview(boolean resumeImage){
        this.resumeImage = resumeImage;
    }

    public abstract String getTitle();
    public abstract String getContent();

    public String getImageUrl(int width, int height){
        if(ImageTags.size() > 0){
            String itemId = Id;
            String imageType = "Primary";
            if(!ImageTags.containsKey(imageType) && ImageTags.containsKey("Thumb")){
                imageType = "Thumb";
            }
            String imageTag = ImageTags.get(imageType);

            if(resumeImage){
                if(ImageTags.containsKey("Thumb")){
                    imageType = "Thumb";
                    imageTag = ImageTags.get(imageType);
                }
            }

            if(Type.equals("Episode") && resumeImage){
                itemId = ParentThumbItemId;
                imageType = "Thumb";
                imageTag = ParentThumbImageTag;
            }

            return SnowbySettings.EMBY_SERVER_ADDRESS + "/emby/Items/" + itemId + "/Images/" + imageType + "?maxWidth=" + width + "&maxHeight=" + height + "&tag=" + imageTag + "&quality=100";
        }
        return null;
    }
}

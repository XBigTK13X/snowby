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

    protected boolean showSpoilers(){
        if(Type != null && Type.equals("Episode")){
            return UserData != null && UserData.Played !=null && UserData.Played;
        }
        return true;
    }

    public String getImageUrl(int width, int height){
        // Don't show thumbnails for episodes you haven't seen yet
        if(!showSpoilers()){
            return null;
        }
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

            String result = SnowbySettings.EMBY_SERVER_ADDRESS + "/emby/Items/" + itemId + "/Images/" + imageType;
            result += "?maxWidth=" + width + "&maxHeight=" + height;
            result += "&tag=" + imageTag + "&quality=100";
            return result;
        }
        return null;
    }
}

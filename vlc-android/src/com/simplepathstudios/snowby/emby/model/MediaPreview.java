package com.simplepathstudios.snowby.emby.model;

import java.util.HashMap;

public abstract class MediaPreview {
    public HashMap<String,String> ImageTags;
    public String getImageUrl(int width, int height){
        if (ImageTags == null){
            return null;
        }
        return getPrimaryImageUrl(width, height);
    }
    public abstract String getTitle();
    public abstract String getContent();
    public abstract String getPrimaryImageUrl(int width, int height);
    public UserData UserData;
}

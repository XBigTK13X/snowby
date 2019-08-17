package com.simplepathstudios.snowby.emby.model;

import java.util.HashMap;

public abstract class MediaPreview {
    public HashMap<String,String> ImageTags;
    public String getImageUrl(){
        if (ImageTags == null){
            return null;
        }
        return getPrimaryImageUrl();
    }
    public abstract String getTitle();
    public abstract String getContent();
    public abstract String getPrimaryImageUrl();
    public abstract Integer getWidth();
    public abstract Integer getHeight();
}

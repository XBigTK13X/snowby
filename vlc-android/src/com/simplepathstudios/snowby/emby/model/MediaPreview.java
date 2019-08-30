package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.util.SnowbySettings;

import java.util.HashMap;

public abstract class MediaPreview {
    public HashMap<String,String> ImageTags;
    public String Id;
    public String getImageUrl(int width, int height){
        if(ImageTags.size() > 0){
            String firstKey = ImageTags.keySet().iterator().next();
            return SnowbySettings.EMBY_SERVER_ADDRESS + "/emby/Items/" + Id + "/Images/"+firstKey+"?maxWidth="+width+"&tag="+ImageTags.get(firstKey)+"&quality=100";
        }
        return null;
    }
    public abstract String getTitle();
    public abstract String getContent();
    public UserData UserData;
}

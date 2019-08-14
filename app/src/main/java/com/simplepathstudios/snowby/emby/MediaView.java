package com.simplepathstudios.snowby.emby;

import java.util.HashMap;

public class MediaView extends MediaPreview {
    public String Name;
    public String Id;
    public String ServerId;
    public String PresentationUniqueKey;
    public String Etag;
    public String SortName;
    public String DisplayPreferencesId;

    @Override
    public String getTitle() {
        return Name;
    }

    @Override
    public String getContent() {
        return "";
    }

    @Override
    public String getPrimaryImageUrl(){
        return "http://9914.us:8096/emby/Items/"+Id+"/Images/Primary?maxHeight=92&maxWidth=164&tag="+ImageTags.get("Primary")+"&quality=100";
    }
}

package com.simplepathstudios.snowby.emby;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class MediaResume extends MediaPreview {
    public String Name;
    public String Id;
    public String ServerId;
    public String SeriesName;
    public String SeasonName;
    public String SeriesId;
    public String SeasonId;
    public String Type;
    public long RunTimeTicks;
    public int ParentBackdropItemId;
    public List<String> ParentBackdropImageTags;
    public String MediaType;

    public MediaResume(){
        ParentBackdropImageTags = new ArrayList<String>();
    }

    @Override
    public String getTitle() {
        return SeriesName;
    }

    @Override
    public String getContent() {
        return Name;
    }

    @Override
    public String getPrimaryImageUrl(){
        //TODO Support movies as well
        return "http://9914.us:8096/emby/Items/" +ParentBackdropItemId+ "/Images/Backdrop?maxWidth=200&tag="+ParentBackdropImageTags.get(0)+"&quality=100";
    }
}

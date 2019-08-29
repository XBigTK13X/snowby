package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.util.SnowbyConstants;

import java.util.ArrayList;
import java.util.Dictionary;
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
    public String getPrimaryImageUrl(int width, int height){
        if(ImageTags.containsKey("Thumb")){
            return SnowbyConstants.EMBY_SERVER_ADDRESS + "/emby/Items/" + Id + "/Images/Thumb?maxWidth="+width+"&tag="+ImageTags.get("Thumb")+"&quality=100";
        }
        if(ParentBackdropImageTags.size()<=0){
            return null;
        }
        return SnowbyConstants.EMBY_SERVER_ADDRESS + "/emby/Items/" +ParentBackdropItemId+ "/Images/Backdrop?maxWidth="+ width+"maxHeight="+height+"&tag="+ParentBackdropImageTags.get(0)+"&quality=100";
    }
}

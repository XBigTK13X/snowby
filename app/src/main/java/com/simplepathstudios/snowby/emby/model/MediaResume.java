package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.presenter.CardPresenter;
import com.simplepathstudios.snowby.util.SnowbyConstants;

import java.util.ArrayList;
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
        return SnowbyConstants.EMBY_SERVER_ADDRESS + "/emby/Items/" +ParentBackdropItemId+ "/Images/Backdrop?maxWidth="+ SnowbyConstants.OVERVIEW_CARD_WIDTH+"maxHeight="+SnowbyConstants.OVERVIEW_CARD_HEIGHT+"&tag="+ParentBackdropImageTags.get(0)+"&quality=100";
    }
}

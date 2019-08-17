package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.presenter.CardPresenter;

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
        return "http://9914.us:8096/emby/Items/" +ParentBackdropItemId+ "/Images/Backdrop?maxWidth="+ CardPresenter.CARD_WIDTH +"maxHeight="+CardPresenter.CARD_HEIGHT+"&tag="+ParentBackdropImageTags.get(0)+"&quality=100";
    }

    @Override
    public Integer getWidth() {
        return 300;
    }

    @Override
    public Integer getHeight() {
        return 200;
    }
}

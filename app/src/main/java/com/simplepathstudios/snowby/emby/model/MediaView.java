package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.presenter.CardPresenter;

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
        return "http://9914.us:8096/emby/Items/"+Id+"/Images/Primary?maxHeight="+CardPresenter.CARD_HEIGHT+"&maxWidth="+ CardPresenter.CARD_WIDTH+"&tag="+ImageTags.get("Primary")+"&quality=100";
    }

    @Override
    public Integer getWidth() {
        return 400;
    }

    @Override
    public Integer getHeight() {
        return 300;
    }
}

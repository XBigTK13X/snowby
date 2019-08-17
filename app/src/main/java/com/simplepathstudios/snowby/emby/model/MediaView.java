package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.util.SnowbyConstants;

public class MediaView extends MediaPreview {
    public String Name;
    public String Id;
    public String ServerId;
    public String PresentationUniqueKey;
    public String Etag;
    public String SortName;
    public String DisplayPreferencesId;
    public String CollectionType;

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
        return SnowbyConstants.EMBY_SERVER_ADDRESS + "/emby/Items/"+Id+"/Images/Primary?maxHeight="+ SnowbyConstants.EMBY_ITEM_CARD_HEIGHT+"&maxWidth="+ SnowbyConstants.EMBY_ITEM_CARD_WIDTH+"&tag="+ImageTags.get("Primary")+"&quality=100";
    }
}

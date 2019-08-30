package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.util.SnowbySettings;

public class MediaView extends MediaPreview {
    public String Name;
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
}

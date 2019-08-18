package com.simplepathstudios.snowby.util;

import android.app.Application;
import android.content.Context;

import com.google.android.exoplayer2.DefaultRenderersFactory;
import com.google.android.exoplayer2.RenderersFactory;

// TODO Needs a better name
public class RenderersManager {
    public static RenderersFactory buildRenderersFactory(boolean preferExtensionRenderer, Context context) {
        @DefaultRenderersFactory.ExtensionRendererMode
        int extensionRendererMode =
                true//useExtensionRenderers()
                        ? (preferExtensionRenderer
                        ? DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER
                        : DefaultRenderersFactory.EXTENSION_RENDERER_MODE_ON)
                        : DefaultRenderersFactory.EXTENSION_RENDERER_MODE_OFF;
        return new DefaultRenderersFactory(context)
                .setExtensionRendererMode(extensionRendererMode);
    }
}

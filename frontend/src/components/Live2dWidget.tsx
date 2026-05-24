import { useEffect, useRef, useState } from 'react';

export default function Live2dWidget() {
  const loaded = useRef(false);
  const oml2dRef = useRef<any>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    import('oh-my-live2d').then(({ loadOml2d }) => {
      const oml2d = loadOml2d({
        dockedPosition: 'left',
        mobileDisplay: true,
        models: [
          {
            name: '小喂',
            path: '/Mao/Mao.model3.json',
            position: [0, 60],
            scale: 0.08,
            mobileScale: 0.06,
            mobilePosition: [80, 80],
            stageStyle: { height: 450 },
            mobileStageStyle: { height: 370, width: 400 },
            motionPreloadStrategy: 'ALL',
          },
        ],
        tips: {
          style: { width: 220, height: 60, left: '50%', transform: 'translateX(-50%) translateY(-80px)' },
          messageLine: 3,
          idleTips: {
            message: [
              '欢迎来到喂你~ 💕',
              '今天想吃什么？男朋友给你做！',
              '心情打卡了吗？😊',
              '有什么问题可以问我，我是小喂！',
              '零食柜补货了吗？🍪',
            ],
            duration: 8000,
            interval: 15000,
            priority: 2,
          },
        },
        menus: {
          items: [
            {
              id: 'Hide',
              icon: 'icon-rest',
              title: '暂时隐藏',
              onClick() {
                oml2dRef.current?.stageSlideOut();
              },
            },
          ],
        },
        statusBar: { loadingMessage: '小喂正在赶来...' },
      });

      oml2dRef.current = oml2d;

      oml2d.onStageSlideIn(() => setHidden(false));
      oml2d.onStageSlideOut(() => setHidden(true));
    });
  }, []);

  return (
    <>
      {hidden && (
        <button
          onClick={() => oml2dRef.current?.stageSlideIn()}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 bg-pink-400 text-white rounded-full shadow-lg
                     hover:bg-pink-500 transition-colors flex items-center justify-center text-lg"
          title="唤出小喂"
        >
          💬
        </button>
      )}
    </>
  );
}

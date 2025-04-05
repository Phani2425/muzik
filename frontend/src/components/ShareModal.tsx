import { useEffect, useState } from 'react';
import { 
  FacebookShareButton, FacebookIcon,
  TwitterShareButton, TwitterIcon,
  WhatsappShareButton, WhatsappIcon,
  TelegramShareButton, TelegramIcon,
  RedditShareButton, RedditIcon,
  LinkedinShareButton, LinkedinIcon,
  EmailShareButton, EmailIcon,
  PinterestShareButton, PinterestIcon,
} from 'react-share';
import { Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  roomId: string;
}

const ShareModal = ({ isOpen, onClose, url, title, roomId }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 m-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Share this room</h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-6 flex items-center">
              <div className="flex-1 truncate text-sm font-mono mr-2">{url}</div>
              <button 
                onClick={copyToClipboard}
                className={`p-2 rounded-md transition-colors ${copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
              >
                <Copy size={16} />
              </button>
            </div>
            
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Share with</div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col items-center gap-1">
                <WhatsappShareButton url={url} title={title} className="transition transform hover:scale-110">
                  <WhatsappIcon size={48} round />
                  <span className="text-xs mt-1">WhatsApp</span>
                </WhatsappShareButton>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <FacebookShareButton url={url} title={title} className="transition transform hover:scale-110">
                  <FacebookIcon size={48} round />
                  <span className="text-xs mt-1">Facebook</span>
                </FacebookShareButton>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <TwitterShareButton url={url} title={title} className="transition transform hover:scale-110">
                  <TwitterIcon size={48} round />
                  <span className="text-xs mt-1">Twitter</span>
                </TwitterShareButton>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <TelegramShareButton url={url} title={title} className="transition transform hover:scale-110">
                  <TelegramIcon size={48} round />
                  <span className="text-xs mt-1">Telegram</span>
                </TelegramShareButton>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <LinkedinShareButton url={url} title={title} className="transition transform hover:scale-110">
                  <LinkedinIcon size={48} round />
                  <span className="text-xs mt-1">LinkedIn</span>
                </LinkedinShareButton>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <RedditShareButton url={url} title={title} className="transition transform hover:scale-110">
                  <RedditIcon size={48} round />
                  <span className="text-xs mt-1">Reddit</span>
                </RedditShareButton>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <EmailShareButton url={url} subject={title} className="transition transform hover:scale-110">
                  <EmailIcon size={48} round />
                  <span className="text-xs mt-1">Email</span>
                </EmailShareButton>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <PinterestShareButton url={url} media={`${url}/thumbnail.png`} description={title} className="transition transform hover:scale-110">
                  <PinterestIcon size={48} round />
                  <span className="text-xs mt-1">Pinterest</span>
                </PinterestShareButton>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Room ID: {roomId}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
import useModal from "@/hooks/use-modal/use-modal";
import styles from "./news.module.scss";
import { Fragment } from "react";
import Button from "@/components/common/button";
import useCallAPI from "@/hooks/use-call-api";
import Skeleton from "@/components/common/skeleton";

type NewsObject = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  image: string;
};

type NewsDisplayProps = {
  news: NewsObject;
  divider?: boolean;
};

const NewsDisplay: React.FC<NewsDisplayProps> = ({ news, divider }) => {
  return (
    <div className={styles.news__content}>
      <h4>{news.title}</h4>

      <p className={styles.news__content__date}>
        Published on{" "}
        <span>{new Date(news.created_at).toLocaleDateString()}</span>
      </p>

      {news.image && (
        <a href={news.image} target="_blank" rel="noopener noreferrer">
          <img src={news.image} alt={news.title} loading="lazy" />
        </a>
      )}

      <p className={styles.news__content__description}>{news.description}</p>

      {divider && <div className={styles.news__content__divider} />}
    </div>
  );
};

const News: React.FC = () => {
  const { open, Modal } = useModal();

  const { data: newsData, loading } = useCallAPI("/news", { method: "GET" });

  if (!loading) {
    if (!newsData) {
      return null;
    }

    if (!newsData.data.length) return null;
  }

  return (
    <Fragment>
      <Modal title="Updates">
        {newsData?.data?.map((news: NewsObject, index: number) => (
          <NewsDisplay
            news={news}
            key={index}
            divider={index < newsData.data.length - 1}
          />
        ))}
      </Modal>

      <div className={`generic-box`}>
        {loading ? (
          <Fragment>
            <Skeleton style={{ height: "25px" }} />
            <Skeleton
              style={{ height: "14px", width: "40%", margin: "10px 0" }}
            />
            <Skeleton style={{ height: "100px" }} />
          </Fragment>
        ) : (
          <Fragment>
            <NewsDisplay news={newsData.data[0]} />

            {newsData.data.length > 1 && (
              <Button
                variant="secondary"
                size="small"
                onClick={open}
                style={{ marginTop: "10px" }}
              >
                See more updates
              </Button>
            )}
          </Fragment>
        )}
      </div>
    </Fragment>
  );
};

export default News;

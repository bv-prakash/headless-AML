
import React from "react";

type InformationBoxProps = {
  title: string;
  content: React.ReactNode;
  actions?: React.ReactNode;
}

export const InformationBox: React.FC<InformationBoxProps> = ({
  title,
  content,
  actions,
}) => {
  return (
    <div className="box border border-aaa w-full lg:max-w-[400px] flex flex-col  ">
      <div className="box-title w-full bg-f0f0f0 uppercase block py-2.5 px-5 leading-[20px] md:py-3.5 md:leading-[23px]">
        <strong className="title">{title}</strong>
      </div>
      <div className="box-content p-5 text-sm leading-[24px] md:text-lg md:leading-[30px]">
        {content}
      </div>

      {
        actions && <div className="box-actions px-5 pb-5 pt-0 flex flex-wrap gap-2 md:pb-7.5 flex-1 items-end">{actions}</div>
      }
    </div>
  );
};
